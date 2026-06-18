import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  async startTimer(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const running = await this.prisma.timeEntry.findFirst({
      where: { userId, startedAt: { not: null }, duration: 0 },
    });
    if (running) {
      await this.stopTimer(running.id, userId);
    }

    return this.prisma.timeEntry.create({
      data: { taskId, userId, startedAt: new Date() },
      include: { task: { select: { id: true, title: true } } },
    });
  }

  async stopTimer(entryId: string, userId: string) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Registro de tempo não encontrado');
    if (entry.userId !== userId) throw new NotFoundException('Registro não encontrado');

    const startedAt = entry.startedAt;
    if (!startedAt) return entry;

    const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: { duration, startedAt: null },
    });
  }

  async logManual(data: { taskId: string; userId: string; duration: number; description?: string }) {
    return this.prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        duration: data.duration,
        description: data.description,
      },
      include: { task: { select: { id: true, title: true } } },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string, limit = 20) {
    return this.prisma.timeEntry.findMany({
      where: { userId },
      include: {
        task: { select: { id: true, title: true, projectId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRunningTimer(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: { userId, startedAt: { not: null }, duration: 0 },
      include: { task: { select: { id: true, title: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Registro não encontrado');
    if (entry.userId !== userId) throw new NotFoundException('Registro não encontrado');
    await this.prisma.timeEntry.delete({ where: { id } });
    return { message: 'Registro excluído' };
  }
}
