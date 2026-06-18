import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string) {
    return this.prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
    });
  }

  async create(taskId: string, content: string) {
    const maxOrder = await this.prisma.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.taskChecklistItem.create({
      data: {
        content,
        taskId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });
  }

  async toggle(id: string) {
    const item = await this.prisma.taskChecklistItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');

    return this.prisma.taskChecklistItem.update({
      where: { id },
      data: { checked: !item.checked },
    });
  }

  async update(id: string, content: string) {
    const item = await this.prisma.taskChecklistItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');

    return this.prisma.taskChecklistItem.update({
      where: { id },
      data: { content },
    });
  }

  async reorder(items: { id: string; order: number }[]) {
    for (const item of items) {
      await this.prisma.taskChecklistItem.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }
    return { message: 'Reordenado' };
  }

  async remove(id: string) {
    await this.prisma.taskChecklistItem.delete({ where: { id } });
    return { message: 'Item removido' };
  }
}
