import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @CurrentUser('sub') userId: string) {
    return this.foldersService.findByProject(projectId, userId);
  }

  @Post()
  create(@Body() data: { name: string; projectId: string; parentId?: string }, @CurrentUser('sub') userId: string) {
    return this.foldersService.create({ ...data, createdById: userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { name: string }, @CurrentUser('sub') userId: string) {
    return this.foldersService.update(id, userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.foldersService.remove(id, userId);
  }
}
