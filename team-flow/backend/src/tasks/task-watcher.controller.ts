import { Controller, Post, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { TaskWatcherService } from './task-watcher.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard)
export class TaskWatcherController {
  constructor(private taskWatcherService: TaskWatcherService) {}

  @Post('tasks/:taskId/watch')
  watch(@Param('taskId') taskId: string, @CurrentUser('sub') userId: string) {
    return this.taskWatcherService.watch(taskId, userId);
  }

  @Delete('tasks/:taskId/watch')
  unwatch(@Param('taskId') taskId: string, @CurrentUser('sub') userId: string) {
    return this.taskWatcherService.unwatch(taskId, userId);
  }

  @Get('tasks/:taskId/watchers')
  getWatchers(@Param('taskId') taskId: string) {
    return this.taskWatcherService.getWatchers(taskId);
  }

  @Get('tasks/:taskId/watching')
  isWatching(@Param('taskId') taskId: string, @CurrentUser('sub') userId: string) {
    return this.taskWatcherService.isWatching(taskId, userId);
  }

  @Get('watched-tasks')
  getWatchedTasks(@CurrentUser('sub') userId: string) {
    return this.taskWatcherService.getWatchedTasks(userId);
  }
}
