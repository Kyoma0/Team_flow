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
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.data.userId = payload.sub;

      const sockets = this.userSockets.get(payload.sub) || [];
      sockets.push(client.id);
      this.userSockets.set(payload.sub, sockets);

      client.join(`user:${payload.sub}`);
      console.log(`Usuário conectado: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) sockets.splice(index, 1);
      if (sockets.length === 0) this.userSockets.delete(userId);
      else this.userSockets.set(userId, sockets);
    }
  }

  @SubscribeMessage('join:group')
  async joinGroup(@ConnectedSocket() client: Socket, @MessageBody() groupId: string) {
    client.join(`group:${groupId}`);
    return { event: 'joined', data: groupId };
  }

  @SubscribeMessage('leave:group')
  async leaveGroup(@ConnectedSocket() client: Socket, @MessageBody() groupId: string) {
    client.leave(`group:${groupId}`);
    return { event: 'left', data: groupId };
  }

  @SubscribeMessage('message:send')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const message = await this.chatService.sendMessage({
      content: data.content,
      groupId: data.groupId,
      userId: client.data.userId,
      fileId: data.fileId,
    });

    this.server.to(`group:${data.groupId}`).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('message:typing')
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string; isTyping: boolean }) {
    client.to(`group:${data.groupId}`).emit('message:typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }
}
