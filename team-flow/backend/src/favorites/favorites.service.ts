import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggleProject(userId: string, projectId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new Error('Você não é membro deste projeto');

    const updated = await this.prisma.projectMember.update({
      where: { id: membership.id },
      data: { isFavorite: !membership.isFavorite },
    });

    return { isFavorite: updated.isFavorite };
  }

  async toggleTask(userId: string, taskId: string) {
    const existing = await this.prisma.favoriteTask.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    if (existing) {
      await this.prisma.favoriteTask.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }

    await this.prisma.favoriteTask.create({ data: { userId, taskId } });
    return { isFavorite: true };
  }

  async getFavoriteProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId, isFavorite: true },
      include: {
        project: {
          select: { id: true, name: true, description: true, status: true, ownerId: true, owner: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map((m) => m.project);
  }

  async getFavoriteTasks(userId: string) {
    const favorites = await this.prisma.favoriteTask.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            project: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.task);
  }

  async isProjectFavorite(userId: string, projectId: string): Promise<boolean> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { isFavorite: true },
    });
    return membership?.isFavorite || false;
  }

  async isTaskFavorite(userId: string, taskId: string): Promise<boolean> {
    const fav = await this.prisma.favoriteTask.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });
    return !!fav;
  }
}
