import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportProject(projectId: string, format: 'json' | 'csv') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { assignedTo: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        members: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });
    if (!project) throw new Error('Projeto não encontrado');

    if (format === 'json') {
      const data = {
        project: {
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
        },
        members: project.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })),
        tasks: project.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignee: t.assignedTo?.name || null,
          dueDate: t.dueDate?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
        })),
      };
      return { data, filename: `${project.name}-export.json`, contentType: 'application/json' };
    }

    const header = 'title,description,status,priority,assignee,dueDate,createdAt';
    const rows = project.tasks.map((t) =>
      [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        `"${t.assignedTo?.name || ''}"`,
        t.dueDate?.toISOString() || '',
        t.createdAt.toISOString(),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    return { data: csv, filename: `${project.name}-export.csv`, contentType: 'text/csv' };
  }

  async exportAllProjects(userId: string, format: 'json' | 'csv') {
    const projects = await this.prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        tasks: {
          include: { assignedTo: { select: { name: true, email: true } } },
        },
        members: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (format === 'json') {
      const data = projects.map((p) => ({
        name: p.name,
        description: p.description,
        members: p.members.map((m) => ({ name: m.user.name, email: m.user.email, role: m.role })),
        tasks: p.tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignedTo?.name || null,
          dueDate: t.dueDate?.toISOString() || null,
        })),
      }));
      return { data, filename: `teamflow-export.json`, contentType: 'application/json' };
    }

    const header = 'project,title,status,priority,assignee,dueDate';
    const rows = projects.flatMap((p) =>
      p.tasks.map((t) =>
        [
          `"${p.name}"`,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          t.status,
          t.priority,
          `"${t.assignedTo?.name || ''}"`,
          t.dueDate?.toISOString() || '',
        ].join(','),
      ),
    );
    return { data: [header, ...rows].join('\n'), filename: 'teamflow-export.csv', contentType: 'text/csv' };
  }

  async importTasks(projectId: string, userId: string, tasks: any[]) {
    const results = { imported: 0, errors: 0, errorMessages: [] as string[] };

    for (const t of tasks) {
      try {
        if (!t.title) throw new Error('Título é obrigatório');
        const status = ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(t.status) ? t.status : 'BACKLOG';
        const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(t.priority) ? t.priority : 'MEDIUM';

        await this.prisma.task.create({
          data: {
            title: t.title,
            description: t.description || '',
            status,
            priority,
            projectId,
            createdById: userId,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
          },
        });
        results.imported++;
      } catch (err: any) {
        results.errors++;
        results.errorMessages.push(`"${t.title || 'sem título'}": ${err.message}`);
      }
    }

    return results;
  }
}
