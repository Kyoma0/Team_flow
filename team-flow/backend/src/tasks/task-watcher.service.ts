import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TaskWatcherService {
  constructor(private prisma: PrismaService) {}

  async watch(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const existing = await this.prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (existing) return { message: 'Você já está observando esta tarefa' };

    await this.prisma.taskWatcher.create({ data: { taskId, userId } });
    return { message: 'Agora você está observando esta tarefa' };
  }

  async unwatch(taskId: string, userId: string) {
    const existing = await this.prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (!existing) return { message: 'Você não está observando esta tarefa' };

    await this.prisma.taskWatcher.delete({
      where: { taskId_userId: { taskId, userId } },
    });
    return { message: 'Você parou de observar esta tarefa' };
  }

  async getWatchers(taskId: string) {
    return this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async isWatching(taskId: string, userId: string) {
    const existing = await this.prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    return { watching: !!existing };
  }

  async getWatchedTasks(userId: string) {
    return this.prisma.taskWatcher.findMany({
      where: { userId },
      include: {
        task: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
