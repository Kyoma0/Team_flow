import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { InAppNotificationController } from './in-app-notification.controller';

@Module({
  controllers: [NotificationsController, InAppNotificationController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
