import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RecurringTaskService {
  private logger = new Logger('RecurringTaskService');

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringTasks() {
    this.logger.log('Processando tarefas recorrentes...');

    const tasks = await this.prisma.task.findMany({
      where: {
        recurring: { not: null },
        deletedAt: null,
      },
      include: { project: true },
    });

    let created = 0;

    for (const task of tasks) {
      if (!task.dueDate || !task.recurring) continue;

      const shouldCreate = this.shouldCreateNext(task);
      if (!shouldCreate) continue;

      const nextDueDate = this.calculateNextDate(task.dueDate, task.recurring);
      if (!nextDueDate) continue;

      if (task.repeatUntil && nextDueDate > task.repeatUntil) continue;

      const existingNext = await this.prisma.task.findFirst({
        where: {
          title: task.title,
          projectId: task.projectId,
          dueDate: nextDueDate,
          deletedAt: null,
        },
      });
      if (existingNext) continue;

      await this.prisma.task.create({
        data: {
          title: task.title,
          description: task.description || '',
          status: task.status || 'NOT_STARTED',
          boardColumnId: task.boardColumnId,
          priority: task.priority,
          projectId: task.projectId,
          assignedToId: task.assignedToId,
          dueDate: nextDueDate,
          recurring: task.recurring,
          repeatUntil: task.repeatUntil,
          createdById: task.createdById,
        },
      });
      created++;
    }

    if (created > 0) {
      this.logger.log(`${created} tarefas recorrentes criadas`);
    }
  }

  private shouldCreateNext(task: any): boolean {
    if (!task.dueDate) return false;
    const now = new Date();
    const due = new Date(task.dueDate);
    return due <= now;
  }

  private calculateNextDate(currentDue: Date, recurring: string): Date | null {
    const next = new Date(currentDue);

    switch (recurring) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekdays': {
        next.setDate(next.getDate() + 1);
        while (next.getDay() === 0 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
        break;
      }
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return null;
    }

    return next;
  }
}
