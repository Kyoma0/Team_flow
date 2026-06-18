import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.tag.findMany({
      where: { projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    return tag;
  }

  async create(data: { name: string; color?: string; projectId: string }) {
    const existing = await this.prisma.tag.findUnique({
      where: { name_projectId: { name: data.name, projectId: data.projectId } },
    });
    if (existing) throw new ConflictException('Tag já existe neste projeto');

    return this.prisma.tag.create({
      data: {
        name: data.name,
        color: data.color || '#3b82f6',
        projectId: data.projectId,
      },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async update(id: string, data: { name?: string; color?: string }) {
    await this.findOne(id);
    return this.prisma.tag.update({
      where: { id },
      data,
      include: { _count: { select: { tasks: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag excluída' };
  }

  async addTagToTask(taskId: string, tagId: string) {
    const existing = await this.prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId } },
    });
    if (existing) return existing;

    return this.prisma.taskTag.create({
      data: { taskId, tagId },
      include: { tag: true },
    });
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    const link = await this.prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId } },
    });
    if (!link) throw new NotFoundException('Tag não está associada a esta tarefa');
    await this.prisma.taskTag.delete({ where: { id: link.id } });
    return { message: 'Tag removida da tarefa' };
  }

  async getTaskTags(taskId: string) {
    return this.prisma.tag.findMany({
      where: { tasks: { some: { taskId } } },
    });
  }
}
