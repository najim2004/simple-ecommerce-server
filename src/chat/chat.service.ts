import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CartService } from 'src/cart/cart.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { AcceptRejectProposalDto } from './dto/accept-reject-proposal.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createChat(createChatDto: CreateChatDto, buyerId: number) {
    this.logger.log(
      `Creating chat for product ${createChatDto.productId} between buyer ${buyerId} and seller ${createChatDto.sellerId}`,
    );
    const { productId, sellerId } = createChatDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      this.logger.error(
        `Product with ID ${productId} not found when creating chat`,
      );
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.sellerId !== sellerId) {
      this.logger.warn(
        `Product ${productId} does not belong to seller ${sellerId}`,
      );
      throw new BadRequestException(
        'Product does not belong to the specified seller',
      );
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: { productId, buyerId, sellerId, status: { not: 'CLOSED' } },
    });

    if (existingChat) {
      this.logger.log(
        `Returning existing chat ${existingChat.id} for product ${productId}`,
      );
      return existingChat; // Return existing chat if open
    }

    const newChat = await this.prisma.chat.create({
      data: {
        productId,
        buyerId,
        sellerId,
      },
    });
    this.logger.log(`New chat ${newChat.id} created for product ${productId}`);
    return newChat;
  }

  async getChatMessages(chatId: number) {
    this.logger.log(`Getting messages for chat ID: ${chatId}`);
    return this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    sendMessageDto: SendMessageDto,
  ) {
    this.logger.log(`User ${senderId} sending message in chat ${chatId}`);
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      this.logger.error(
        `Chat with ID ${chatId} not found when sending message`,
      );
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
      this.logger.warn(`Sender ${senderId} is not part of chat ${chatId}`);
      throw new BadRequestException('Sender is not part of this chat');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        message: sendMessageDto.message,
      },
    });
    this.logger.log(`Message sent in chat ${chatId} by user ${senderId}`);
    return message;
  }

  async proposePrice(
    chatId: number,
    senderId: number,
    proposePriceDto: ProposePriceDto,
  ) {
    this.logger.log(
      `User ${senderId} proposing price ${proposePriceDto.price} in chat ${chatId}`,
    );
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      this.logger.error(
        `Chat with ID ${chatId} not found when proposing price`,
      );
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
      this.logger.warn(`Sender ${senderId} is not part of chat ${chatId}`);
      throw new BadRequestException('Sender is not part of this chat');
    }

    const proposal = await this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        priceOffered: proposePriceDto.price,
        isProposal: true,
      },
    });
    this.logger.log(
      `Price proposal ${proposePriceDto.price} made in chat ${chatId} by user ${senderId}`,
    );
    return proposal;
  }

  async acceptRejectProposal(
    chatId: number,
    messageId: number,
    receiverId: number,
    acceptRejectProposalDto: AcceptRejectProposalDto,
  ) {
    this.logger.log(
      `User ${receiverId} attempting to ${acceptRejectProposalDto.accepted ? 'accept' : 'reject'} proposal ${messageId} in chat ${chatId}`,
    );
    const { accepted } = acceptRejectProposalDto;

    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      this.logger.error(
        `Chat with ID ${chatId} not found when accepting/rejecting proposal`,
      );
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message || !message.isProposal || !message.priceOffered) {
      this.logger.warn(
        `Message ${messageId} is not a valid price proposal in chat ${chatId}`,
      );
      throw new BadRequestException('Message is not a valid price proposal');
    }

    if (message.senderId === receiverId) {
      this.logger.warn(
        `User ${receiverId} tried to accept/reject their own proposal ${messageId}`,
      );
      throw new BadRequestException('Cannot accept/reject your own proposal');
    }

    if (chat.buyerId !== receiverId && chat.sellerId !== receiverId) {
      this.logger.warn(`Receiver ${receiverId} is not part of chat ${chatId}`);
      throw new BadRequestException('Receiver is not part of this chat');
    }

    // Update the proposal message status
    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { accepted, rejected: !accepted },
    });

    if (accepted) {
      const product = await this.prisma.product.findUnique({
        where: { id: chat.productId },
      });
      if (!product) {
        this.logger.error(
          `Product with ID ${chat.productId} not found after proposal acceptance in chat ${chatId}`,
        );
        throw new NotFoundException(
          `Product with ID ${chat.productId} not found`,
        );
      }

      const targetUserId =
        message.senderId === chat.buyerId ? chat.buyerId : chat.sellerId; // The one who made the proposal

      await this.cartService.addToCart(targetUserId, {
        productId: product.id,
        quantity: 1, // Assuming 1 for now, can be extended
      });
      this.logger.log(
        `Product ${product.id} added to cart of user ${targetUserId} after proposal acceptance in chat ${chatId}`,
      );

      // Update chat status to accepted
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { status: 'ACCEPTED', acceptedPrice: message.priceOffered },
      });
      this.logger.log(
        `Chat ${chatId} status updated to ACCEPTED with price ${message.priceOffered}`,
      );
    }

    return updatedMessage;
  }

  async getChatsForUser(userId: number) {
    this.logger.log(`Getting chats for user ID: ${userId}`);
    return this.prisma.chat.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: { product: true, buyer: true, seller: true },
    });
  }
}
