import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TaskTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string; color?: string; items: { title: string; description?: string; priority?: string }[] }, userId: string) {
    return this.prisma.taskTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        createdById: userId,
        items: {
          create: data.items.map((item, index) => ({
            title: item.title,
            description: item.description,
            priority: item.priority || 'MEDIUM',
            order: index,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async findAll(userId: string) {
    return this.prisma.taskTemplate.findMany({
      where: { createdById: userId },
      include: { items: { orderBy: { order: 'asc' }, select: { id: true, title: true, priority: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Template não encontrado');
    return template;
  }

  async apply(templateId: string, projectId: string, userId: string) {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Template não encontrado');

    const tasks = await Promise.all(
      template.items.map((item) =>
        this.prisma.task.create({
          data: {
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: 'NOT_STARTED',
            projectId,
            createdById: userId,
            position: Date.now() + item.order,
          },
        }),
      ),
    );

    return { message: `${tasks.length} tarefas criadas a partir do template "${template.name}"`, count: tasks.length };
  }

  async remove(id: string, userId: string) {
    const template = await this.prisma.taskTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template não encontrado');
    await this.prisma.taskTemplate.delete({ where: { id } });
    return { message: 'Template excluído' };
  }
}
