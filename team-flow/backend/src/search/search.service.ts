import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, query: string) {
    const userProjectIds = await this.getUserProjectIds(userId);

    const [projects, tasks, users, files, messages, deliveries] = await Promise.all([
      this.searchProjects(userProjectIds, query),
      this.searchTasks(userProjectIds, query),
      this.searchUsers(query),
      this.searchFiles(userProjectIds, query),
      this.searchMessages(userProjectIds, query),
      this.searchDeliveries(userProjectIds, query),
    ]);

    return { projects, tasks, users, files, messages, deliveries };
  }

  private async getUserProjectIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    return memberships.map((m) => m.projectId);
  }

  private async searchProjects(projectIds: string[], query: string) {
    if (projectIds.length === 0) return [];
    return this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 5,
      include: {
        owner: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  private async searchTasks(projectIds: string[], query: string) {
    if (projectIds.length === 0) return [];
    return this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 5,
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  private async searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { username: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 5,
      select: { id: true, username: true, name: true, avatar: true },
    });
  }

  private async searchFiles(projectIds: string[], query: string) {
    if (projectIds.length === 0) return [];
    return this.prisma.file.findMany({
      where: {
        projectId: { in: projectIds },
        originalName: { contains: query },
      },
      take: 5,
      include: {
        uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  private async searchMessages(projectIds: string[], query: string) {
    if (projectIds.length === 0) return [];
    return this.prisma.message.findMany({
      where: {
        group: { projectId: { in: projectIds } },
        content: { contains: query },
      },
      take: 5,
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }

  private async searchDeliveries(projectIds: string[], query: string) {
    if (projectIds.length === 0) return [];
    return this.prisma.delivery.findMany({
      where: {
        projectId: { in: projectIds },
        title: { contains: query },
      },
      take: 5,
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }
}
