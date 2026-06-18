import { Controller, Get, Post, Param, Query, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from '../common/export.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('export')
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('project/:projectId')
  async exportProject(
    @Param('projectId') projectId: string,
    @Query('format') format: 'json' | 'csv',
    @Res() res: Response,
  ) {
    const { data, filename, contentType } = await this.exportService.exportProject(projectId, format || 'json');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }

  @Get('all')
  async exportAll(
    @Query('format') format: 'json' | 'csv',
    @CurrentUser('sub') userId: string,
    @Res() res: Response,
  ) {
    const { data, filename, contentType } = await this.exportService.exportAllProjects(userId, format || 'json');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }

  @Post('import/:projectId')
  async importTasks(
    @Param('projectId') projectId: string,
    @Body() body: { tasks: any[] },
    @CurrentUser('sub') userId: string,
  ) {
    return this.exportService.importTasks(projectId, userId, body.tasks);
  }
}
