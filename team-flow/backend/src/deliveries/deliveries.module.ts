import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhookModule } from '../webhooks/webhook.module';

@Module({
  imports: [NotificationsModule, WebhookModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
