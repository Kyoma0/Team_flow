import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(AuthGuard)
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.tagsService.findByProject(projectId);
  }

  @Get('task/:taskId')
  getTaskTags(@Param('taskId') taskId: string) {
    return this.tagsService.getTaskTags(taskId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string; color?: string; projectId: string }) {
    return this.tagsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    return this.tagsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post('task/:taskId/tag/:tagId')
  addTagToTask(@Param('taskId') taskId: string, @Param('tagId') tagId: string) {
    return this.tagsService.addTagToTask(taskId, tagId);
  }

  @Delete('task/:taskId/tag/:tagId')
  removeTagFromTask(@Param('taskId') taskId: string, @Param('tagId') tagId: string) {
    return this.tagsService.removeTagFromTask(taskId, tagId);
  }
}
