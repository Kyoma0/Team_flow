import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('tasks/:taskId/checklist')
@UseGuards(AuthGuard)
export class ChecklistController {
  constructor(private checklistService: ChecklistService) {}

  @Get()
  findByTask(@Param('taskId') taskId: string) {
    return this.checklistService.findByTask(taskId);
  }

  @Post()
  create(@Param('taskId') taskId: string, @Body() body: { content: string }) {
    return this.checklistService.create(taskId, body.content);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.checklistService.toggle(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { content: string }) {
    return this.checklistService.update(id, body.content);
  }

  @Post('reorder')
  reorder(@Body() body: { items: { id: string; order: number }[] }) {
    return this.checklistService.reorder(body.items);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }
}
