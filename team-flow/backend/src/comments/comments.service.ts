import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { content: string; taskId: string; userId: string }) {
    const task = await this.prisma.task.findUnique({ where: { id: data.taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const comment = await this.prisma.taskComment.create({
      data: { content: data.content, taskId: data.taskId, userId: data.userId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return comment;
  }

  async findByTask(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId, parentId: null },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        replies: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addReply(data: { content: string; commentId: string; userId: string }) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id: data.commentId } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');

    return this.prisma.taskComment.create({
      data: { content: data.content, taskId: comment.taskId, userId: data.userId, parentId: data.commentId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) throw new NotFoundException('Não autorizado');
    await this.prisma.taskComment.delete({ where: { id } });
    return { message: 'Comentário removido' };
  }
}
