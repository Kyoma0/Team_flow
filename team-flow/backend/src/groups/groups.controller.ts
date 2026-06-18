import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@Body() data: { name: string; projectId: string }, @CurrentUser('sub') userId: string) {
    return this.groupsService.create({ ...data, createdById: userId });
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.findByProject(projectId, userId);
  }

  @Get('dm')
  findUserDMs(@CurrentUser('sub') userId: string) {
    return this.groupsService.findUserDMs(userId);
  }

  @Post('dm/:targetUserId')
  findOrCreateDM(@Param('targetUserId') targetUserId: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.findOrCreateDM(userId, targetUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.findOne(id, userId);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.join(id, userId);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.leave(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.groupsService.remove(id, userId);
  }
}
