import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { WsJwtAuthGuard } from 'src/auth/ws-jwt-auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { AcceptRejectProposalDto } from './dto/accept-reject-proposal.dto';

// ✅ Define a safe Socket interface that includes "data.user"
interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: number;
      [key: string]: any;
    };
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // 🟢 CREATE CHAT
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createChat')
  async createChat(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const client = socket as AuthenticatedSocket;

    const userId = client.data.user.id;
    const chat = await this.chatService.createChat(createChatDto, userId);

    void client.join(chat.id.toString());
    client.emit('chatCreated', chat);
    return chat;
  }

  // 🟢 JOIN CHAT
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinChat')
  async joinChat(
    @MessageBody() chatId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    const client = socket as AuthenticatedSocket;

    const chat = await this.chatService.getChatMessages(chatId);
    if (chat) {
      void client.join(chatId.toString());
      client.emit('chatMessages', chat);
    } else {
      client.emit('error', 'Chat not found');
    }
  }

  // 🟢 SEND MESSAGE
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: { chatId: number; message: SendMessageDto },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = socket as AuthenticatedSocket;

    const userId = client.data.user.id;
    const message = await this.chatService.sendMessage(
      data.chatId,
      userId,
      data.message,
    );

    this.server.to(data.chatId.toString()).emit('newMessage', message);
    return message;
  }

  // 🟢 PROPOSE PRICE
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('proposePrice')
  async proposePrice(
    @MessageBody() data: { chatId: number; proposal: ProposePriceDto },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = socket as AuthenticatedSocket;

    const userId = client.data.user.id;
    const proposal = await this.chatService.proposePrice(
      data.chatId,
      userId,
      data.proposal,
    );

    this.server.to(data.chatId.toString()).emit('newProposal', proposal);
    return proposal;
  }

  // 🟢 ACCEPT OR REJECT PROPOSAL
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('acceptRejectProposal')
  async acceptRejectProposal(
    @MessageBody()
    data: {
      chatId: number;
      messageId: number;
      decision: AcceptRejectProposalDto;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = socket as AuthenticatedSocket;

    const userId = client.data.user.id;
    const updatedMessage = await this.chatService.acceptRejectProposal(
      data.chatId,
      data.messageId,
      userId,
      data.decision,
    );

    this.server
      .to(data.chatId.toString())
      .emit('proposalUpdated', updatedMessage);
    return updatedMessage;
  }

  // 🟢 GET USER CHATS
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getChats')
  async getChats(@ConnectedSocket() socket: Socket) {
    const client = socket as AuthenticatedSocket;

    const userId = client.data.user.id;
    const chats = await this.chatService.getChatsForUser(userId);

    client.emit('userChats', chats);
    return chats;
  }
}
