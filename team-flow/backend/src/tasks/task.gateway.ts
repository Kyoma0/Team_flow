import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ApiTokenService } from '../auth/api-token.service';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true },
  namespace: '/tasks',
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private apiTokenService: ApiTokenService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        client.data.userId = payload.sub;
        client.data.authType = 'jwt';
        client.join(`user:${payload.sub}`);
        return;
      } catch {
        // not a JWT, fall through to API token check
      }

      const tk = await this.apiTokenService.validateToken(token);
      if (!tk) {
        client.disconnect();
        return;
      }
      client.data.userId = tk.userId;
      client.data.authType = 'api_token';
      client.data.tokenId = tk.id;
      client.join(`user:${tk.userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // no cleanup needed
  }

  @SubscribeMessage('join:project')
  async joinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.join(`project:${projectId}`);
    return { event: 'joined', data: projectId };
  }

  @SubscribeMessage('leave:project')
  async leaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.leave(`project:${projectId}`);
    return { event: 'left', data: projectId };
  }

  emitTaskCreated(task: any) {
    this.server.to(`project:${task.projectId}`).emit('task:created', task);
  }

  emitTaskUpdated(task: any) {
    this.server.to(`project:${task.projectId}`).emit('task:updated', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project:${projectId}`).emit('task:deleted', { taskId, projectId });
  }
}
