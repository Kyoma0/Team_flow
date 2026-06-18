import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiTokenService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.apiToken.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, lastUsed: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, name: string) {
    const token = `tf_${crypto.randomBytes(32).toString('hex')}`;
    await this.prisma.apiToken.create({
      data: { name, token, userId },
    });
    return { token };
  }

  async remove(id: string, userId: string) {
    const tk = await this.prisma.apiToken.findFirst({ where: { id, userId } });
    if (!tk) throw new NotFoundException('Token não encontrado');
    await this.prisma.apiToken.delete({ where: { id } });
    return { message: 'Token revogado' };
  }

  async validateToken(token: string) {
    const tk = await this.prisma.apiToken.findUnique({ where: { token } });
    if (!tk) return null;
    await this.prisma.apiToken.update({
      where: { id: tk.id },
      data: { lastUsed: new Date() },
    });
    return tk;
  }
}
