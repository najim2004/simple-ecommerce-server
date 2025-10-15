import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  getRequest(context: ExecutionContext): any {
    const client: Socket = context.switchToWs().getClient();

    const authHeader = client.handshake.headers.authorization;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookie: string = client.handshake.headers.cookie || '';
      token = cookie
        .split('; ')
        .find((c) => c.startsWith('jwt='))
        ?.split('=')[1];
    }

    if (!token) {
      this.logger.warn('No token found in WebSocket connection');
    }

    return {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
    };
  }
}
