import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';

@Controller('notification-preferences')
@UseGuards(AuthGuard)
export class NotificationPreferencesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async get(@CurrentUser('sub') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyTaskAssigned: true,
        notifyTaskStatus: true,
        notifyDeliveryStatus: true,
        notifyMentioned: true,
        notifyCommentReply: true,
      },
    });
    return user;
  }

  @Patch()
  async update(
    @CurrentUser('sub') userId: string,
    @Body() body: {
      notifyTaskAssigned?: boolean;
      notifyTaskStatus?: boolean;
      notifyDeliveryStatus?: boolean;
      notifyMentioned?: boolean;
      notifyCommentReply?: boolean;
    },
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: body,
    });
    return { message: 'Preferências salvas' };
  }
}
