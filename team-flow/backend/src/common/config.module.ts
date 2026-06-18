import { Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { TrashService } from './trash.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { PlanLimitsService } from './plan-limits.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  providers: [
    {
      provide: 'CONFIG',
      useFactory: () => {
        require('dotenv').config();
        return process.env;
      },
    },
    MinioService,
    TrashService,
    EmailService,
    PushService,
    PlanLimitsService,
    NotificationService,
  ],
  exports: ['CONFIG', MinioService, TrashService, EmailService, PushService, PlanLimitsService, NotificationService],
})
export class ConfigModule {}
