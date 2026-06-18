import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; company?: string; email?: string; phone?: string; notes?: string; createdById: string }) {
    return this.prisma.client.create({
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { projects: true } },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.client.findMany({
      where: { createdById: userId },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, createdById: userId },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        projects: {
          select: { id: true, name: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(id: string, userId: string, data: { name?: string; company?: string; email?: string; phone?: string; notes?: string }) {
    const client = await this.prisma.client.findFirst({ where: { id, createdById: userId } });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { projects: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const client = await this.prisma.client.findFirst({ where: { id, createdById: userId } });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    return this.prisma.client.delete({ where: { id } });
  }
}
