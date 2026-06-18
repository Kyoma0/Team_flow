import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';

@Controller('push')
@UseGuards(AuthGuard)
export class PushSubscriptionController {
  constructor(private prisma: PrismaService) {}

  @Post('subscribe')
  async subscribe(@CurrentUser('sub') userId: string, @Body() body: { subscription: any }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: JSON.stringify(body.subscription) },
    });
    return { message: 'Inscrito' };
  }

  @Post('unsubscribe')
  async unsubscribe(@CurrentUser('sub') userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: null },
    });
    return { message: 'Removido' };
  }
}
