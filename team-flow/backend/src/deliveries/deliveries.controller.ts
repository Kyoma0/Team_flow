import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('deliveries')
@UseGuards(AuthGuard)
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @Post()
  create(@Body() data: { title: string; description?: string; projectId: string; dueDate?: string }, @CurrentUser('sub') userId: string) {
    return this.deliveriesService.create({ ...data, createdById: userId });
  }

  @Get('project/:projectId')
  findAll(@Param('projectId') projectId: string, @CurrentUser('sub') userId: string) {
    return this.deliveriesService.findAll(projectId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.deliveriesService.findOne(id, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: string; reviewNote?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.deliveriesService.updateStatus(id, userId, data.status, data.reviewNote);
  }

  @Post(':id/versions')
  addVersion(
    @Param('id') id: string,
    @Body() data: { note?: string; files?: string[] },
    @CurrentUser('sub') userId: string,
  ) {
    return this.deliveriesService.addVersion(id, userId, data.note, data.files);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.deliveriesService.remove(id, userId);
  }
}
