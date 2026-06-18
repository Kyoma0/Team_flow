import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email.service';
import { WebhookService } from '../common/webhook.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private emailService: EmailService,
    private webhookService: WebhookService,
  ) {}

  async findByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedToId: userId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
        boardColumn: true,
        tags: { include: { tag: true } },
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async create(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    projectId: string;
    assignedToId?: string;
    boardColumnId?: string;
    createdById: string;
    recurring?: string;
    repeatUntil?: string;
  }) {
    const boardColumn = data.boardColumnId
      ? await this.getBoardColumnForProject(data.boardColumnId, data.projectId)
      : null;

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: boardColumn?.status || data.status || 'NOT_STARTED',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        assignedToId: data.assignedToId,
        boardColumnId: boardColumn?.id,
        createdById: data.createdById,
        recurring: data.recurring,
        repeatUntil: data.repeatUntil ? new Date(data.repeatUntil) : null,
        position: Date.now(),
      },
      include: {
        assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        boardColumn: true,
      },
    });

    await this.createHistory(task.id, data.createdById, 'created', undefined, task.status);

    if (data.assignedToId && data.assignedToId !== data.createdById) {
      await this.notifications.create({
        type: 'task_new',
        content: `Você recebeu uma nova tarefa: ${task.title}`,
        recipientId: data.assignedToId,
        senderId: data.createdById,
        projectId: data.projectId,
        taskId: task.id,
      });

      const project = await this.prisma.project.findUnique({ where: { id: data.projectId }, select: { name: true } });
      const assignedUser = await this.prisma.user.findUnique({ where: { id: data.assignedToId }, select: { email: true } });
      if (assignedUser?.email) {
        await this.emailService.sendTaskNotification('assigned', assignedUser.email, task.title, project?.name || '').catch(() => {});
      }
    }

    await this.webhookService.dispatch('task.created', task, task.projectId).catch(() => {});

    return task;
  }

  async findByProject(
    projectId: string,
    userId: string,
    filters?: { status?: string; priority?: string; assignedToId?: string; dueDateFrom?: string; dueDateTo?: string },
    page = 1,
    limit = 50,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    const where: any = { projectId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
          createdBy: { select: { id: true, username: true, name: true, avatar: true } },
          boardColumn: true,
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { position: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    const grouped = {
      NOT_STARTED: tasks.filter((t) => t.status === 'NOT_STARTED'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      PAUSED: tasks.filter((t) => t.status === 'PAUSED'),
      IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
      COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
    };

    const stats = {
      total,
      notStarted: grouped.NOT_STARTED.length,
      inProgress: grouped.IN_PROGRESS.length,
      paused: grouped.PAUSED.length,
      inReview: grouped.IN_REVIEW.length,
      completed: grouped.COMPLETED.length,
    };

    return { grouped, stats, all: tasks, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        boardColumn: true,
        tags: { include: { tag: true } },
        comments: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        histories: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        files: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        dependencies: {
          include: { dependsOn: { select: { id: true, title: true, status: true, priority: true } } },
        },
        dependents: {
          include: { task: { select: { id: true, title: true, status: true, priority: true } } },
        },
      },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    return task;
  }

  async update(id: string, userId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    assignedToId?: string;
    boardColumnId?: string;
    position?: number;
    recurring?: string;
    repeatUntil?: string;
  }) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const oldStatus = task.status;
    const updateData: any = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      repeatUntil: data.repeatUntil ? new Date(data.repeatUntil) : undefined,
    };

    if (data.boardColumnId === '') {
      updateData.boardColumnId = null;
    } else if (data.boardColumnId) {
      const boardColumn = await this.getBoardColumnForProject(data.boardColumnId, task.projectId);
      updateData.boardColumnId = boardColumn.id;
      updateData.status = boardColumn.status;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        boardColumn: true,
      },
    });

    if (updateData.status && updateData.status !== oldStatus) {
      await this.createHistory(id, userId, 'status', oldStatus, updateData.status);
      if (task.assignedToId && task.assignedToId !== userId) {
        await this.notifications.create({
          type: 'task_status',
          content: `Tarefa "${task.title}" mudou para ${updateData.status}`,
          recipientId: task.assignedToId,
          senderId: userId,
          projectId: task.projectId,
          taskId: id,
        });

        const project = await this.prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } });
        const assignedUser = await this.prisma.user.findUnique({ where: { id: task.assignedToId }, select: { email: true } });
        if (assignedUser?.email) {
          await this.emailService.sendTaskNotification('status_change', assignedUser.email, task.title, project?.name || '').catch(() => {});
        }
      }

      const project = await this.prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } });
      await this.emailService.notifyTaskWatchers(id, task.title, `A tarefa "${task.title}" mudou de status para "${updateData.status}".`, project?.name || '').catch(() => {});
    }

    if (data.priority && data.priority !== task.priority) {
      const project = await this.prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } });
      await this.emailService.notifyTaskWatchers(id, task.title, `A prioridade da tarefa "${task.title}" mudou para "${data.priority}".`, project?.name || '').catch(() => {});
    }

    await this.webhookService.dispatch('task.updated', updated, task.projectId).catch(() => {});

    return updated;
  }

  async bulkOperation(taskIds: string[], action: string, value: string) {
    let updated = 0;

    for (const taskId of taskIds) {
      try {
        const data: any = {};

        switch (action) {
          case 'status':
            if (['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'IN_REVIEW', 'COMPLETED'].includes(value)) {
              data.status = value;
            }
            break;
          case 'priority':
            if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(value)) {
              data.priority = value;
            }
            break;
          case 'assign':
            data.assignedToId = value || null;
            break;
          case 'delete':
            await this.prisma.task.delete({ where: { id: taskId } });
            updated++;
            continue;
          default:
            continue;
        }

        if (Object.keys(data).length > 0) {
          await this.prisma.task.update({ where: { id: taskId }, data });
          updated++;
        }
      } catch {
        // Skip failed tasks
      }
    }

    return { updated, total: taskIds.length };
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Tarefa excluída' };
  }

  async addDependency(taskId: string, dependsOnId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const dependsOn = await this.prisma.task.findUnique({ where: { id: dependsOnId } });
    if (!dependsOn) throw new NotFoundException('Tarefa dependente não encontrada');

    if (taskId === dependsOnId) throw new BadRequestException('Uma tarefa não pode depender de si mesma');

    // Check for circular dependency
    const circular = await this.prisma.taskDependency.findFirst({
      where: { taskId: dependsOnId, dependsOnId: taskId },
    });
    if (circular) throw new BadRequestException('Dependência circular detectada');

    return this.prisma.taskDependency.create({
      data: { taskId, dependsOnId },
      include: {
        dependsOn: { select: { id: true, title: true, status: true } },
      },
    });
  }

  async removeDependency(id: string, userId: string) {
    const dep = await this.prisma.taskDependency.findUnique({ where: { id } });
    if (!dep) throw new NotFoundException('Dependência não encontrada');
    await this.prisma.taskDependency.delete({ where: { id } });
    return { message: 'Dependência removida' };
  }

  async softDelete(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async getTrash(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId, deletedAt: { not: null } },
      include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  private async createHistory(taskId: string, userId: string, field: string, oldValue?: string, newValue?: string) {
    return this.prisma.taskHistory.create({
      data: { taskId, userId, field, oldValue, newValue },
    });
  }

  private async getBoardColumnForProject(boardColumnId: string, projectId: string) {
    const boardColumn = await this.prisma.boardColumn.findUnique({
      where: { id: boardColumnId },
      include: { board: true },
    });
    if (!boardColumn) throw new BadRequestException('Coluna do board nao encontrada');
    if (boardColumn.board.projectId !== projectId) {
      throw new BadRequestException('Coluna do board nao pertence ao projeto da tarefa');
    }

    return boardColumn;
  }
}
