import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

const CACHE_TTL = 60;

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getStats(userId: string) {
    const cacheKey = `dashboard:stats:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const projects = await this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { tasks: true, members: true } },
        tasks: { select: { status: true, updatedAt: true } },
      },
    });

    const allTasks = projects.flatMap((p) => p.tasks);

    const stats = {
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === 'ACTIVE').length,
        completed: projects.filter((p) => p.status === 'COMPLETED').length,
        archived: projects.filter((p) => p.status === 'ARCHIVED').length,
      },
      tasks: {
        total: allTasks.length,
        notStarted: allTasks.filter((t) => t.status === 'NOT_STARTED').length,
        inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        paused: allTasks.filter((t) => t.status === 'PAUSED').length,
        completed: allTasks.filter((t) => t.status === 'COMPLETED').length,
      },
      recentProjects: await this.prisma.project.findMany({
        where: { members: { some: { userId } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true, name: true, status: true,
          _count: { select: { tasks: true, members: true } },
          owner: { select: { id: true, username: true, name: true, avatar: true } },
        },
      }),
      recentTasks: await this.prisma.task.findMany({
        where: { project: { members: { some: { userId } } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
        },
      }),
    };

    // Productividade: tarefas concluídas nos últimos 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCompleted = allTasks.filter(
      (t) => t.status === 'COMPLETED' && t.updatedAt >= sevenDaysAgo,
    );

    const result = {
      ...stats,
      productivity: {
        completedThisWeek: recentCompleted.length,
        completionRate: allTasks.length > 0
          ? Math.round((allTasks.filter((t) => t.status === 'COMPLETED').length / allTasks.length) * 100)
          : 0,
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  }
}
