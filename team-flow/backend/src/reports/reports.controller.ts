import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private exportService: ReportsExportService,
  ) {}

  @Get('tasks')
  async taskReport(
    @CurrentUser('sub') userId: string,
    @Query('projectId') projectId?: string,
    @Query('period') period?: string,
  ) {
    return this.reportsService.getTaskReport(userId, projectId, period ? parseInt(period) : 30);
  }

  @Get('productivity')
  getProductivity(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.productivity(userId, startDate, endDate);
  }

  @Get('deliveries')
  getDeliveries(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.deliveries(userId, startDate, endDate);
  }

  @Get('delays')
  getDelays(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.delays(userId, startDate, endDate);
  }

  @Get('collaborator/:collaboratorId')
  getByCollaborator(
    @CurrentUser('sub') userId: string,
    @Param('collaboratorId') collaboratorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.byCollaborator(userId, collaboratorId, startDate, endDate);
  }

  @Get('project/:projectId')
  getByProject(
    @CurrentUser('sub') userId: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.byProject(userId, projectId, startDate, endDate);
  }

  @Get('export/productivity')
  async exportProductivity(
    @Res() res: Response,
    @CurrentUser('sub') userId: string,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reportsService.productivity(userId, startDate, endDate);
    const headers = ['Projeto', 'Total Tarefas', 'Concluídas', 'Taxa de Conclusão'];
    const rows = data.tasksByProject.map((p: any) => [
      p.projectName, String(p.total), String(p.completed), `${p.completionRate}%`,
    ]);

    if (format === 'pdf') {
      const buf = await this.exportService.exportToPDF('Relatório de Produtividade', headers, rows);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="produtividade.pdf"' });
      res.send(buf);
    } else if (format === 'xlsx') {
      const buf = await this.exportService.exportToExcel('Produtividade', headers, rows);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="produtividade.xlsx"' });
      res.send(buf);
    } else {
      const csv = this.exportService.exportToCSV(headers, rows);
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="produtividade.csv"' });
      res.send('\uFEFF' + csv);
    }
  }

  @Get('export/deliveries')
  async exportDeliveries(
    @Res() res: Response,
    @CurrentUser('sub') userId: string,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reportsService.deliveries(userId, startDate, endDate);
    const headers = ['Projeto', 'Total', 'Aprovadas', 'Em Revisão', 'Correções'];
    const rows = data.byProject.map((p: any) => [
      p.projectName, String(p.total), String(p.approved), String(p.inReview), String(p.corrections),
    ]);

    if (format === 'pdf') {
      const buf = await this.exportService.exportToPDF('Relatório de Entregas', headers, rows);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="entregas.pdf"' });
      res.send(buf);
    } else if (format === 'xlsx') {
      const buf = await this.exportService.exportToExcel('Entregas', headers, rows);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="entregas.xlsx"' });
      res.send(buf);
    } else {
      const csv = this.exportService.exportToCSV(headers, rows);
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="entregas.csv"' });
      res.send('\uFEFF' + csv);
    }
  }

  @Get('export/delays')
  async exportDelays(
    @Res() res: Response,
    @CurrentUser('sub') userId: string,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reportsService.delays(userId, startDate, endDate);
    const headers = ['Tipo', 'Título', 'Projeto', 'Data de Vencimento', 'Status'];
    const rows = [
      ...data.overdueTasks.map((t: any) => ['Tarefa', t.title, t.project.name, new Date(t.dueDate).toLocaleDateString('pt-BR'), t.status]),
      ...data.overdueDeliveries.map((d: any) => ['Entrega', d.title, d.project.name, new Date(d.dueDate).toLocaleDateString('pt-BR'), d.status]),
    ];

    if (format === 'pdf') {
      const buf = await this.exportService.exportToPDF('Relatório de Atrasos', headers, rows);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="atrasos.pdf"' });
      res.send(buf);
    } else if (format === 'xlsx') {
      const buf = await this.exportService.exportToExcel('Atrasos', headers, rows);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="atrasos.xlsx"' });
      res.send(buf);
    } else {
      const csv = this.exportService.exportToCSV(headers, rows);
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="atrasos.csv"' });
      res.send('\uFEFF' + csv);
    }
  }

  @Get('export/project/:projectId')
  async exportProject(
    @Res() res: Response,
    @CurrentUser('sub') userId: string,
    @Param('projectId') projectId: string,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reportsService.byProject(userId, projectId, startDate, endDate);
    const taskHeaders = ['Título', 'Status', 'Prioridade', 'Responsável', 'Vencimento', 'Criado Em'];
    const taskRows = data.tasks.map((t: any) => [
      t.title, t.status, t.priority, t.assignedTo?.name || '-',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '-',
      new Date(t.createdAt).toLocaleDateString('pt-BR'),
    ]);

    if (format === 'pdf') {
      const buf = await this.exportService.exportToPDF(`Relatório do Projeto: ${data.name}`, taskHeaders, taskRows);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="projeto-${projectId}.pdf"` });
      res.send(buf);
    } else if (format === 'xlsx') {
      const buf = await this.exportService.exportToExcel('Tarefas', taskHeaders, taskRows);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="projeto-${projectId}.xlsx"` });
      res.send(buf);
    } else {
      const csv = this.exportService.exportToCSV(taskHeaders, taskRows);
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="projeto-${projectId}.csv"` });
      res.send('\uFEFF' + csv);
    }
  }
}
