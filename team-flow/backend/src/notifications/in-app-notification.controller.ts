import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../common/notification.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class InAppNotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('unread-count')
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
