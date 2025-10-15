import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ConversationService } from './conversation.service';
import { WsJwtAuthGuard } from 'src/auth/ws-jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { AcceptRejectProposalDto } from './dto/accept-reject-proposal.dto';
import { JwtPayload } from 'src/auth/auth.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

// ✅ Define a safe Socket interface that includes "data.user"
interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}

import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class ConversationGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ConversationGateway.name);

  constructor(private readonly conversationService: ConversationService) {}

  // 🟢 CREATE CONVERSATION
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createConversation')
  async createConversation(
    @MessageBody() createConversationDto: CreateConversationDto,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log('createConversation');
    const client = socket as AuthenticatedSocket;

    const userId: string = client.data.user.id.toString();
    const conversation = await this.conversationService.createConversation(
      createConversationDto,
      userId,
    );

    void client.join(conversation.id.toString());
    void client.emit('conversationCreated', conversation);
    return conversation;
  }

  // 🟢 JOIN CONVERSATION
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`joinConversation: ${conversationId}`);
    const client = socket as AuthenticatedSocket;

    const messages =
      await this.conversationService.getConversationMessages(conversationId);
    if (messages) {
      void client.join(conversationId.toString());
      void client.emit('conversationMessages', messages);
    } else {
      void client.emit('error', 'Conversation not found');
    }
  }

  // 🟢 SEND MESSAGE
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: { conversationId: string; message: SendMessageDto },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`sendMessage: ${data.conversationId}`);
    const client = socket as AuthenticatedSocket;

    const userId: string = client.data.user.id.toString();
    const message = await this.conversationService.sendMessage(
      data.conversationId,
      userId,
      data.message,
    );

    this.server.to(data.conversationId.toString()).emit('newMessage', message);
    return message;
  }

  // 🟢 PROPOSE PRICE
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('proposePrice')
  async proposePrice(
    @MessageBody() data: { conversationId: string; proposal: ProposePriceDto },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`proposePrice: ${data.conversationId}`);
    const client = socket as AuthenticatedSocket;

    const userId: string = client.data.user.id.toString();
    const proposal = await this.conversationService.proposePrice(
      data.conversationId,
      userId,
      data.proposal,
    );

    this.server
      .to(data.conversationId.toString())
      .emit('newProposal', proposal);
    return proposal;
  }

  // 🟢 ACCEPT OR REJECT PROPOSAL
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('acceptRejectProposal')
  async acceptRejectProposal(
    @MessageBody()
    data: {
      conversationId: string;
      messageId: string;
      decision: AcceptRejectProposalDto;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`acceptRejectProposal: ${data.conversationId}`);
    const client = socket as AuthenticatedSocket;

    const userId: string = client.data.user.id.toString();
    const updatedMessage = await this.conversationService.acceptRejectProposal(
      data.conversationId,
      data.messageId,
      userId,
      data.decision,
    );

    this.server
      .to(data.conversationId.toString())
      .emit('proposalUpdated', updatedMessage);
    return updatedMessage;
  }

  // 🟢 GET USER CONVERSATIONS
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getConversations')
  async getConversations(@ConnectedSocket() socket: Socket) {
    this.logger.log('getConversations');
    const client = socket as AuthenticatedSocket;

    const userId: string = client.data.user.id.toString();
    const conversations =
      await this.conversationService.getConversationsForUser(userId);

    void client.emit('userConversations', conversations);
    return conversations;
  }
}
