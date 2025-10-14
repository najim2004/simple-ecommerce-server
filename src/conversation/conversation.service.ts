import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CartService } from 'src/cart/cart.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { AcceptRejectProposalDto } from './dto/accept-reject-proposal.dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createConversation(
    createConversationDto: CreateConversationDto,
    buyerId: string,
  ) {
    this.logger.log(
      `Creating conversation for product ${createConversationDto.productId} between buyer ${buyerId} and seller ${createConversationDto.sellerId}`,
    );
    const { productId, sellerId } = createConversationDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      this.logger.error(
        `Product with ID ${productId} not found when creating conversation`,
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

    const existingConversation = await this.prisma.conversation.findFirst({
      where: { productId, buyerId, sellerId, status: { not: 'CLOSED' } },
    });

    if (existingConversation) {
      this.logger.log(
        `Returning existing conversation ${existingConversation.id} for product ${productId}`,
      );
      return existingConversation; // Return existing chat if open
    }

    const newConversation = await this.prisma.conversation.create({
      data: {
        productId,
        buyerId,
        sellerId,
      },
    });
    this.logger.log(
      `New conversation ${newConversation.id} created for product ${productId}`,
    );
    return newConversation;
  }

  async getConversationMessages(conversationId: string) {
    this.logger.log(`Getting messages for conversation ID: ${conversationId}`);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    sendMessageDto: SendMessageDto,
  ) {
    this.logger.log(
      `User ${senderId} sending message in conversation ${conversationId}`,
    );
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      this.logger.error(
        `Conversation with ID ${conversationId} not found when sending message`,
      );
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    if (
      conversation.buyerId !== senderId &&
      conversation.sellerId !== senderId
    ) {
      this.logger.warn(
        `Sender ${senderId} is not part of conversation ${conversationId}`,
      );
      throw new BadRequestException('Sender is not part of this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        message: sendMessageDto.message,
      },
    });
    this.logger.log(
      `Message sent in conversation ${conversationId} by user ${senderId}`,
    );
    return message;
  }

  async proposePrice(
    conversationId: string,
    senderId: string,
    proposePriceDto: ProposePriceDto,
  ) {
    this.logger.log(
      `User ${senderId} proposing price ${proposePriceDto.price} in conversation ${conversationId}`,
    );
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      this.logger.error(
        `Conversation with ID ${conversationId} not found when proposing price`,
      );
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    if (
      conversation.buyerId !== senderId &&
      conversation.sellerId !== senderId
    ) {
      this.logger.warn(
        `Sender ${senderId} is not part of conversation ${conversationId}`,
      );
      throw new BadRequestException('Sender is not part of this conversation');
    }

    const proposal = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        priceOffered: proposePriceDto.price,
        isProposal: true,
      },
    });
    this.logger.log(
      `Price proposal ${proposePriceDto.price} made in conversation ${conversationId} by user ${senderId}`,
    );
    return proposal;
  }

  async acceptRejectProposal(
    conversationId: string,
    messageId: string,
    receiverId: string,
    acceptRejectProposalDto: AcceptRejectProposalDto,
  ) {
    this.logger.log(
      `User ${receiverId} attempting to ${acceptRejectProposalDto.accepted ? 'accept' : 'reject'} proposal ${messageId} in conversation ${conversationId}`,
    );
    const { accepted } = acceptRejectProposalDto;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      this.logger.error(
        `Conversation with ID ${conversationId} not found when accepting/rejecting proposal`,
      );
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || !message.isProposal || !message.priceOffered) {
      this.logger.warn(
        `Message ${messageId} is not a valid price proposal in conversation ${conversationId}`,
      );
      throw new BadRequestException('Message is not a valid price proposal');
    }

    if (message.senderId === receiverId) {
      this.logger.warn(
        `User ${receiverId} tried to accept/reject their own proposal ${messageId}`,
      );
      throw new BadRequestException('Cannot accept/reject your own proposal');
    }

    if (
      conversation.buyerId !== receiverId &&
      conversation.sellerId !== receiverId
    ) {
      this.logger.warn(
        `Receiver ${receiverId} is not part of conversation ${conversationId}`,
      );
      throw new BadRequestException(
        'Receiver is not part of this conversation',
      );
    }

    // Update the proposal message status
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { accepted, rejected: !accepted },
    });

    if (accepted) {
      const product = await this.prisma.product.findUnique({
        where: { id: conversation.productId },
      });
      if (!product) {
        this.logger.error(
          `Product with ID ${conversation.productId} not found after proposal acceptance in conversation ${conversationId}`,
        );
        throw new NotFoundException(
          `Product with ID ${conversation.productId} not found`,
        );
      }

      const targetUserId =
        message.senderId === conversation.buyerId
          ? conversation.buyerId
          : conversation.sellerId; // The one who made the proposal

      await this.cartService.addToCart(targetUserId, {
        productId: product.id,
        quantity: 1, // Assuming 1 for now, can be extended
      });
      this.logger.log(
        `Product ${product.id} added to cart of user ${targetUserId} after proposal acceptance in conversation ${conversationId}`,
      );

      // Update chat status to accepted
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'ACCEPTED', acceptedPrice: message.priceOffered },
      });
      this.logger.log(
        `Conversation ${conversationId} status updated to ACCEPTED with price ${message.priceOffered}`,
      );
    }

    return updatedMessage;
  }

  async getConversationsForUser(userId: string) {
    this.logger.log(`Getting conversations for user ID: ${userId}`);
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: { product: true, buyer: true, seller: true },
    });
  }
}
