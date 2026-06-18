import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('task-templates')
@UseGuards(AuthGuard)
export class TaskTemplateController {
  constructor(private taskTemplateService: TaskTemplateService) {}

  @Post()
  create(@Body() data: { name: string; description?: string; color?: string; items: { title: string; description?: string; priority?: string }[] }, @CurrentUser('sub') userId: string) {
    return this.taskTemplateService.create(data, userId);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.taskTemplateService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTemplateService.findOne(id);
  }

  @Post(':id/apply/:projectId')
  apply(@Param('id') id: string, @Param('projectId') projectId: string, @CurrentUser('sub') userId: string) {
    return this.taskTemplateService.apply(id, projectId, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.taskTemplateService.remove(id, userId);
  }
}
