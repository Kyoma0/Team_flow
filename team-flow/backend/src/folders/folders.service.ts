import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    const folders = await this.prisma.folder.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return this.buildTree(folders);
  }

  async create(data: { name: string; projectId: string; parentId?: string; createdById: string }) {
    return this.prisma.folder.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        parentId: data.parentId,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  async update(id: string, userId: string, data: { name: string }) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Pasta não encontrada');

    const project = await this.prisma.project.findUnique({ where: { id: folder.projectId } });
    if (folder.createdById !== userId && project?.ownerId !== userId) {
      throw new ForbiddenException('Apenas o criador ou dono do projeto pode renomear esta pasta');
    }

    return this.prisma.folder.update({
      where: { id },
      data: { name: data.name },
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Pasta não encontrada');

    const project = await this.prisma.project.findUnique({ where: { id: folder.projectId } });
    if (folder.createdById !== userId && project?.ownerId !== userId) {
      throw new ForbiddenException('Apenas o criador ou dono do projeto pode excluir esta pasta');
    }

    await this.prisma.folder.delete({ where: { id } });
    return { message: 'Pasta excluída' };
  }

  private buildTree(folders: any[]) {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const folder of folders) {
      map.set(folder.id, { ...folder, children: [] });
    }

    for (const folder of folders) {
      if (folder.parentId && map.has(folder.parentId)) {
        map.get(folder.parentId).children.push(map.get(folder.id));
      } else if (!folder.parentId) {
        roots.push(map.get(folder.id));
      }
    }

    return roots;
  }
}
