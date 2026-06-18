import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('time')
@UseGuards(AuthGuard)
export class TimeTrackingController {
  constructor(private timeTrackingService: TimeTrackingService) {}

  @Post('start/:taskId')
  startTimer(@Param('taskId') taskId: string, @CurrentUser('sub') userId: string) {
    return this.timeTrackingService.startTimer(taskId, userId);
  }

  @Post('stop/:id')
  stopTimer(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.timeTrackingService.stopTimer(id, userId);
  }

  @Post('log')
  logManual(@Body() data: { taskId: string; duration: number; description?: string }, @CurrentUser('sub') userId: string) {
    return this.timeTrackingService.logManual({ ...data, userId });
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.timeTrackingService.findByTask(taskId);
  }

  @Get('user/me')
  findMyTime(@CurrentUser('sub') userId: string, @Query('limit') limit?: string) {
    return this.timeTrackingService.findByUser(userId, parseInt(limit || '20'));
  }

  @Get('running')
  getRunning(@CurrentUser('sub') userId: string) {
    return this.timeTrackingService.getRunningTimer(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.timeTrackingService.remove(id, userId);
  }
}
