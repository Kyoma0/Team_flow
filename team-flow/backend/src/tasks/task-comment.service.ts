import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TaskCommentService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId, parentId: null },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { content: string; taskId: string; userId: string; parentId?: string }) {
    return this.prisma.taskComment.create({
      data: {
        content: data.content,
        taskId: data.taskId,
        userId: data.userId,
        parentId: data.parentId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async update(id: string, userId: string, content: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) throw new Error('Você só pode editar seus próprios comentários');

    return this.prisma.taskComment.update({
      where: { id },
      data: { content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) throw new Error('Você só pode excluir seus próprios comentários');

    await this.prisma.taskComment.delete({ where: { id } });
    return { message: 'Comentário excluído' };
  }
}
