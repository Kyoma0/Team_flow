import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerMiddleware } from './common/logger.middleware';
import { ConfigModule } from './common/config.module';
import { RedisModule } from './common/redis.module';
import { PrismaModule } from './common/prisma.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { GroupsModule } from './groups/groups.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationPreferencesModule } from './notifications/notification-preferences.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { PlansModule } from './plans/plans.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { FoldersModule } from './folders/folders.module';
import { SearchModule } from './search/search.module';
import { CalendarModule } from './calendar/calendar.module';
import { ClientsModule } from './clients/clients.module';
import { BackupModule } from './backup/backup.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { WebhookModule } from './webhooks/webhook.module';
import { ExportModule } from './export/export.module';
import { PushModule } from './push/push.module';
import { TagsModule } from './tags/tags.module';
import { FavoritesModule } from './favorites/favorites.module';
import { InviteModule } from './invites/invite.module';
import { BoardsModule } from './boards/boards.module';
import { CompaniesModule } from './companies/companies.module';
import { ChatGateway } from './chat/chat.gateway';
import { TrashController } from './trash.controller';
import { CleanupService } from './common/cleanup.service';
import { SentryService } from './common/sentry.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),
    ConfigModule,
    RedisModule,
    PrismaModule,
    AdminModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    FilesModule,
    GroupsModule,
    ChatModule,
    NotificationsModule,
    NotificationPreferencesModule,
    DashboardModule,
    ReportsModule,
    PlansModule,
    BackupModule,
    AuditModule,
    ClientsModule,
    DeliveriesModule,
    FoldersModule,
    SearchModule,
    CalendarModule,
    HealthModule,
    WebhookModule,
    ExportModule,
    PushModule,
    TagsModule,
    FavoritesModule,
    InviteModule,
    BoardsModule,
    CompaniesModule,
  ],
  controllers: [TrashController],
  providers: [
    ChatGateway,
    CleanupService,
    SentryService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
