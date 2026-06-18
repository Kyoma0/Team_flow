import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: string;
    content: string;
    recipientId: string;
    senderId?: string;
    projectId?: string;
    taskId?: string;
    deliveryId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  async findByUser(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        include: {
          sender: { select: { id: true, username: true, name: true, avatar: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, read: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, recipientId: userId },
    });
  }
}
