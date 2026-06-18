import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { InviteService } from '../common/invite.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @Post('invites')
  @UseGuards(AuthGuard)
  create(@Body() body: { email: string; role?: string; projectId?: string }, @CurrentUser('sub') userId: string) {
    return this.inviteService.create(body.email, body.role || 'MEMBER', body.projectId, userId);
  }

  @Post('invites/:token/accept')
  @UseGuards(AuthGuard)
  accept(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    return this.inviteService.accept(token, userId);
  }

  @Get('invites/pending')
  @UseGuards(AuthGuard)
  pending(@CurrentUser('sub') userId: string) {
    return this.inviteService.findByEmail(userId);
  }

  @Get('projects/:projectId/invites')
  @UseGuards(AuthGuard)
  projectInvites(@Param('projectId') projectId: string) {
    return this.inviteService.findByProject(projectId);
  }

  @Delete('invites/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.inviteService.remove(id);
  }
}
