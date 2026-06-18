import { Module } from '@nestjs/common';
import { NotificationPreferencesController } from './notification-preferences.controller';

@Module({
  controllers: [NotificationPreferencesController],
})
export class NotificationPreferencesModule {}
