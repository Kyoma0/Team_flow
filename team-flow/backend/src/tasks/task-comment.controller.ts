import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TaskCommentService } from './task-comment.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@Controller('tasks/:taskId/comments')
@UseGuards(AuthGuard)
@ApiTags('Comentários')
@ApiBearerAuth()
export class TaskCommentController {
  constructor(private taskCommentService: TaskCommentService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comentários de uma tarefa' })
  findByTask(@Param('taskId') taskId: string) {
    return this.taskCommentService.findByTask(taskId);
  }

  @Post()
  @ApiOperation({ summary: 'Adicionar comentário a uma tarefa' })
  create(
    @Param('taskId') taskId: string,
    @Body() body: { content: string; parentId?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.taskCommentService.create({ ...body, taskId, userId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar comentário' })
  update(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.taskCommentService.update(id, userId, body.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir comentário' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.taskCommentService.remove(id, userId);
  }
}
