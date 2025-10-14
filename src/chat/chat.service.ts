import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CartService } from 'src/cart/cart.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { AcceptRejectProposalDto } from './dto/accept-reject-proposal.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createChat(createChatDto: CreateChatDto, buyerId: number) {
    const { productId, sellerId } = createChatDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.sellerId !== sellerId) {
      throw new BadRequestException(
        'Product does not belong to the specified seller',
      );
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: { productId, buyerId, sellerId, status: { not: 'CLOSED' } },
    });

    if (existingChat) {
      return existingChat; // Return existing chat if open
    }

    return this.prisma.chat.create({
      data: {
        productId,
        buyerId,
        sellerId,
      },
    });
  }

  async getChatMessages(chatId: number) {
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
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
      throw new BadRequestException('Sender is not part of this chat');
    }

    return this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        message: sendMessageDto.message,
      },
    });
  }

  async proposePrice(
    chatId: number,
    senderId: number,
    proposePriceDto: ProposePriceDto,
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
      throw new BadRequestException('Sender is not part of this chat');
    }

    return this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        priceOffered: proposePriceDto.price,
        isProposal: true,
      },
    });
  }

  async acceptRejectProposal(
    chatId: number,
    messageId: number,
    receiverId: number,
    acceptRejectProposalDto: AcceptRejectProposalDto,
  ) {
    const { accepted } = acceptRejectProposalDto;

    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message || !message.isProposal || !message.priceOffered) {
      throw new BadRequestException('Message is not a valid price proposal');
    }

    if (message.senderId === receiverId) {
      throw new BadRequestException('Cannot accept/reject your own proposal');
    }

    if (chat.buyerId !== receiverId && chat.sellerId !== receiverId) {
      throw new BadRequestException('Receiver is not part of this chat');
    }

    // Update the proposal message status
    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { accepted, rejected: !accepted },
    });

    if (accepted) {
      // Add product to cart if accepted
      const product = await this.prisma.product.findUnique({
        where: { id: chat.productId },
      });
      if (!product) {
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

      // Update chat status to accepted
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { status: 'ACCEPTED', acceptedPrice: message.priceOffered },
      });
    }

    return updatedMessage;
  }

  async getChatsForUser(userId: number) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: { product: true, buyer: true, seller: true },
    });
  }
}
