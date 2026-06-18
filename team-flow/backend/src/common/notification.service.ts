import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string, body?: string, type?: string, link?: string) {
    return this.prisma.inAppNotification.create({
      data: { userId, title, body, type: type || 'info', link },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inAppNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inAppNotification.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.inAppNotification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
