import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const userSelect = { id: true, username: true, name: true, avatar: true };

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private parseDate(date?: string): Date | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    return isNaN(d.getTime()) ? undefined : d;
  }

  private async getMemberProjectIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    return memberships.map((m) => m.projectId);
  }

  async getTaskReport(userId: string, projectId?: string, days = 30) {
    const projectIds = await this.getMemberProjectIds(userId);
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      deletedAt: null,
      createdAt: { gte: dateFrom },
      projectId: { in: projectIds },
    };
    if (projectId) where.projectId = projectId;

    const tasks = await this.prisma.task.findMany({
      where,
      include: { assignedTo: { select: { name: true } } },
    });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};
    let overdue = 0;

    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      const name = t.assignedTo?.name || 'Sem responsável';
      byAssignee[name] = (byAssignee[name] || 0) + 1;
      if (t.dueDate && t.dueDate < new Date() && t.status !== 'DONE') overdue++;
    }

    return { total: tasks.length, byStatus, byPriority, byAssignee, overdue };
  }

  async productivity(userId: string, startDate?: string, endDate?: string) {
    const projectIds = await this.getMemberProjectIds(userId);
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        ...(start || end ? {
          updatedAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        } : {}),
      },
      select: { id: true, status: true, projectId: true, project: { select: { name: true } } },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED');

    const projectMap = new Map<string, { projectName: string; total: number; completed: number }>();
    for (const t of tasks) {
      const entry = projectMap.get(t.projectId) || {
        projectName: t.project.name,
        total: 0,
        completed: 0,
      };
      entry.total++;
      if (t.status === 'COMPLETED') entry.completed++;
      projectMap.set(t.projectId, entry);
    }

    return {
      tasksCompleted: completed.length,
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      tasksByProject: Array.from(projectMap.entries()).map(([projectId, data]) => ({
        projectId,
        ...data,
      })),
    };
  }

  async deliveries(userId: string, startDate?: string, endDate?: string) {
    const projectIds = await this.getMemberProjectIds(userId);
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        projectId: { in: projectIds },
        ...(start || end ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        } : {}),
      },
      select: { id: true, status: true, projectId: true, project: { select: { name: true } } },
    });

    const total = deliveries.length;
    const approved = deliveries.filter((d) => d.status === 'APPROVED').length;
    const inReview = deliveries.filter((d) => d.status === 'IN_REVIEW').length;
    const corrections = deliveries.filter((d) => d.status === 'CORRECTIONS').length;

    const projectMap = new Map<string, { projectName: string; total: number; approved: number; inReview: number; corrections: number }>();
    for (const d of deliveries) {
      const entry = projectMap.get(d.projectId) || {
        projectName: d.project.name,
        total: 0, approved: 0, inReview: 0, corrections: 0,
      };
      entry.total++;
      if (d.status === 'APPROVED') entry.approved++;
      if (d.status === 'IN_REVIEW') entry.inReview++;
      if (d.status === 'CORRECTIONS') entry.corrections++;
      projectMap.set(d.projectId, entry);
    }

    return {
      total,
      approved,
      inReview,
      corrections,
      byProject: Array.from(projectMap.entries()).map(([projectId, data]) => ({
        projectId,
        ...data,
      })),
    };
  }

  async delays(userId: string, startDate?: string, endDate?: string) {
    const projectIds = await this.getMemberProjectIds(userId);
    const now = new Date();
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now, ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) },
        status: { not: 'COMPLETED' },
      },
      select: {
        id: true, title: true, dueDate: true, status: true,
        project: { select: { id: true, name: true } },
        assignedTo: { select: userSelect },
      },
      orderBy: { dueDate: 'asc' },
    });

    const overdueDeliveries = await this.prisma.delivery.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now, ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) },
        status: { not: 'APPROVED' },
      },
      select: {
        id: true, title: true, dueDate: true, status: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return { overdueTasks, overdueDeliveries };
  }

  async byCollaborator(userId: string, collaboratorId: string, startDate?: string, endDate?: string) {
    const projectIds = await this.getMemberProjectIds(userId);
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    const dateFilter = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };

    const tasksAssigned = await this.prisma.task.count({
      where: {
        projectId: { in: projectIds },
        assignedToId: collaboratorId,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
    });

    const tasksCompleted = await this.prisma.task.count({
      where: {
        projectId: { in: projectIds },
        assignedToId: collaboratorId,
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { updatedAt: dateFilter } : {}),
      },
    });

    const deliveriesSent = await this.prisma.delivery.count({
      where: {
        projectId: { in: projectIds },
        createdById: collaboratorId,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
    });

    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId },
      select: userSelect,
    });

    return {
      collaborator,
      tasksAssigned,
      tasksCompleted,
      deliveriesSent,
    };
  }

  async byProject(userId: string, projectId: string, startDate?: string, endDate?: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this project');

    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    const dateFilter = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
          select: { id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true, assignedTo: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
        deliveries: {
          where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
          select: { id: true, title: true, status: true, dueDate: true, createdAt: true, createdBy: { select: userSelect }, reviewedBy: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          include: { user: { select: userSelect } },
        },
        owner: { select: userSelect },
        client: { select: { id: true, name: true } },
      },
    });

    if (!project) throw new ForbiddenException('Project not found');

    const tasksByStatus = {
      NOT_STARTED: project.tasks.filter((t) => t.status === 'NOT_STARTED').length,
      IN_PROGRESS: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      PAUSED: project.tasks.filter((t) => t.status === 'PAUSED').length,
      COMPLETED: project.tasks.filter((t) => t.status === 'COMPLETED').length,
    };

    return {
      ...project,
      tasksByStatus,
    };
  }
}
