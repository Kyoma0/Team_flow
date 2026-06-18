import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async search(q: string) {
    const query = q.replace('@', '');
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, data: { name?: string; roleType?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.user.update({
      where: { id },
      data: { name: data.name, isActive: data.isActive, roleType: data.roleType as any },
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true, isActive: true },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Usuário desativado' };
  }
}
