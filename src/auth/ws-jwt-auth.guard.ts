import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): unknown {
    const client: Socket = context.switchToWs().getClient();
    const cookie: string = client.handshake.headers.cookie || '';
    const authToken = cookie
      .split('; ')
      .find((c) => c.startsWith('jwt='))
      ?.split('=')[1];

    return {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    };
  }
}
