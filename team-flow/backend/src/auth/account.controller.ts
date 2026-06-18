import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private prisma: PrismaService) {}

  @Get('export')
  async exportData(@CurrentUser('sub') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, createdAt: true,
        memberships: {
          include: {
            project: {
              include: {
                tasks: { select: { title: true, status: true, priority: true, createdAt: true } },
                files: { select: { originalName: true, size: true, createdAt: true } },
              },
            },
          },
        },
      },
    });

    return user;
  }

  @Post('delete')
  async requestDeletion(@CurrentUser('sub') userId: string) {
    await this.prisma.message.deleteMany({ where: { userId } });
    await this.prisma.groupMember.deleteMany({ where: { userId } });
    await this.prisma.projectMember.deleteMany({ where: { userId } });
    await this.prisma.timeEntry.deleteMany({ where: { userId } });
    await this.prisma.taskComment.deleteMany({ where: { userId } });
    await this.prisma.fileVersion.deleteMany({ where: { uploadedById: userId } });
    await this.prisma.file.deleteMany({ where: { uploadedById: userId } });
    await this.prisma.auditLog.deleteMany({ where: { userId } });
    await this.prisma.webhook.deleteMany({ where: { createdById: userId } });
    await this.prisma.apiToken.deleteMany({ where: { userId } });
    await this.prisma.invite.deleteMany({ where: { invitedById: userId } });
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Conta e todos os dados foram excluídos permanentemente' };
  }
}
