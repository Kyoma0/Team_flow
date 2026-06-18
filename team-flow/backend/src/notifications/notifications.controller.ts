import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PushService } from '../common/push.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushService,
  ) {}

  @Post('push-subscribe')
  subscribe(
    @CurrentUser('sub') userId: string,
    @Body() subscription: any,
  ) {
    return this.pushService.subscribe(userId, subscription);
  }

  @Post('push-unsubscribe')
  unsubscribe(@CurrentUser('sub') userId: string) {
    return this.pushService.unsubscribe(userId);
  }

  @Get()
  findByUser(@CurrentUser('sub') userId: string) {
    return this.notificationsService.findByUser(userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.remove(id, userId);
  }
}
