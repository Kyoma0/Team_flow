import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingController } from './time-tracking.controller';
import { TaskTemplateService } from './task-template.service';
import { TaskTemplateController } from './task-template.controller';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldController } from './custom-field.controller';
import { TaskCommentService } from './task-comment.service';
import { TaskCommentController } from './task-comment.controller';
import { TaskWatcherService } from './task-watcher.service';
import { TaskWatcherController } from './task-watcher.controller';
import { RecurringTaskService } from './recurring-task.service';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhookModule } from '../webhooks/webhook.module';

@Module({
  imports: [NotificationsModule, WebhookModule],
  controllers: [TasksController, TimeTrackingController, TaskTemplateController, CustomFieldController, TaskCommentController, TaskWatcherController, ChecklistController],
  providers: [TasksService, TimeTrackingService, TaskTemplateService, CustomFieldService, TaskCommentService, TaskWatcherService, RecurringTaskService, ChecklistService],
  exports: [TasksService, TimeTrackingService, TaskTemplateService, CustomFieldService, TaskCommentService, TaskWatcherService, RecurringTaskService, ChecklistService],
})
export class TasksModule {}
