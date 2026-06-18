import { Module } from '@nestjs/common';
import { PushSubscriptionController } from './push-subscription.controller';
import { PushNotificationService } from './push-notification.service';

@Module({
  controllers: [PushSubscriptionController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushModule {}
