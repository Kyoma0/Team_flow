import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(data: { content?: string; groupId: string; userId: string; fileId?: string }) {
    return this.prisma.message.create({
      data,
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        file: { select: { id: true, originalName: true, size: true, mimeType: true } },
      },
    });
  }

  async getMessages(groupId: string, limit = 50, before?: string) {
    const where: any = { groupId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    return this.prisma.message.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        file: { select: { id: true, originalName: true, size: true, mimeType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async searchMessages(groupId: string, query: string, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        groupId,
        content: { contains: query },
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        file: { select: { id: true, originalName: true, size: true, mimeType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(messageId: string, userId: string) {
    // Em produção: implementar confirmação de leitura
    return { message: 'Mensagem lida' };
  }
}
