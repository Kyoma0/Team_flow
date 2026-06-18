import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getEvents(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((m) => m.projectId);

    const [tasks, projects, deliveries] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { gte: start, lte: end },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          priority: true,
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.project.findMany({
        where: {
          id: { in: projectIds },
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          owner: { select: { id: true, name: true } },
        },
      }),
      this.prisma.delivery.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { createdAt: { gte: start, lte: end } },
            { dueDate: { gte: start, lte: end } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      tasks: tasks.map((t) => ({
        ...t,
        type: 'task',
        date: t.dueDate,
      })),
      projects: projects.map((p) => ({
        ...p,
        type: 'project',
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      deliveries: deliveries.map((d) => ({
        ...d,
        type: 'delivery',
        date: d.dueDate || d.createdAt,
      })),
    };
  }
}
