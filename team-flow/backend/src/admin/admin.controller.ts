import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, emailVerified: true,
        twoFactorEnabled: true, createdAt: true,
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  @Get('stats')
  async stats() {
    const [users, projects, tasks, files, deliveries] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.task.count(),
      this.prisma.file.count(),
      this.prisma.delivery.count(),
    ]);
    return { users, projects, tasks, files, deliveries };
  }

  @Get('plans')
  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: { name?: string; email?: string; emailVerified?: boolean }) {
    return this.prisma.user.update({ where: { id }, data: body, select: { id: true, name: true, email: true, emailVerified: true } });
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário excluído' };
  }
}
