import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(AuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  create(@Body() data: { content: string; taskId: string }, @CurrentUser('sub') userId: string) {
    return this.commentsService.create({ ...data, userId });
  }

  @Post('reply')
  addReply(@Body() data: { content: string; commentId: string }, @CurrentUser('sub') userId: string) {
    return this.commentsService.addReply({ ...data, userId });
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.commentsService.remove(id, userId);
  }
}
