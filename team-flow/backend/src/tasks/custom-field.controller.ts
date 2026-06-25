import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard)
export class CustomFieldController {
  constructor(private customFieldService: CustomFieldService) {}

  @Get('projects/:projectId/custom-fields')
  findByProject(@Param('projectId') projectId: string) {
    return this.customFieldService.findByProject(projectId);
  }

  @Post('projects/:projectId/custom-fields')
  create(@Param('projectId') projectId: string, @Body() body: { name: string; type: string; required?: boolean; options?: string[] }, @CurrentUser() user: any) {
    return this.customFieldService.create({ ...body, projectId, userId: user.sub });
  }

  @Patch('custom-fields/:id')
  update(@Param('id') id: string, @Body() body: { name?: string; type?: string; required?: boolean; options?: string[] }) {
    return this.customFieldService.update(id, body);
  }

  @Delete('custom-fields/:id')
  remove(@Param('id') id: string) {
    return this.customFieldService.remove(id);
  }

  @Post('tasks/:taskId/custom-fields/:fieldId')
  setValue(@Param('taskId') taskId: string, @Param('fieldId') fieldId: string, @Body() body: { value: string }) {
    return this.customFieldService.setValue(fieldId, taskId, body.value);
  }

  @Get('tasks/:taskId/custom-fields')
  getValues(@Param('taskId') taskId: string) {
    return this.customFieldService.getValues(taskId);
  }
}
