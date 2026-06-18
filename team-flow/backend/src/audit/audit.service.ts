import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const userSelect = { id: true, username: true, name: true, avatar: true };

interface FindAllQuery {
  page: number;
  limit: number;
  userId?: string;
  entity?: string;
  action?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(userId: string, action: string, entity: string, entityId?: string, metadata?: string, ipAddress?: string) {
    return this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata, ipAddress },
    });
  }

  async findAll(query: FindAllQuery) {
    const { page, limit, userId, entity, action } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: userSelect } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
