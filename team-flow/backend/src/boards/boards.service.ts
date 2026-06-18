import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class BoardsService {
  private readonly DEFAULT_COLUMNS = [
    { name: 'Nao iniciada', color: '#6b7280', status: 'NOT_STARTED', order: 0 },
    { name: 'Em andamento', color: '#3b82f6', status: 'IN_PROGRESS', order: 1 },
    { name: 'Pausada', color: '#eab308', status: 'PAUSED', order: 2 },
    { name: 'Em revisao', color: '#a855f7', status: 'IN_REVIEW', order: 3 },
    { name: 'Concluida', color: '#22c55e', status: 'COMPLETED', order: 4 },
  ];

  constructor(private prisma: PrismaService) {}

  async createDefaultBoard(projectId: string) {
    const existing = await this.prisma.board.findFirst({
      where: {
        projectId,
        OR: [{ isDefault: true }, { name: 'Board Principal' }],
      },
      include: this.boardInclude(),
      orderBy: { order: 'asc' },
    });

    if (existing) return existing;

    return this.prisma.board.create({
      data: {
        name: 'Board Principal',
        projectId,
        isDefault: true,
        order: 0,
        columns: { create: this.DEFAULT_COLUMNS },
      },
      include: this.boardInclude(),
    });
  }

  async create(dto: CreateBoardDto, userId: string) {
    await this.assertProjectAccess(dto.projectId, userId);

    const boardCount = await this.prisma.board.count({
      where: { projectId: dto.projectId },
    });
    const columns = dto.columns?.length ? dto.columns : this.DEFAULT_COLUMNS;

    return this.prisma.board.create({
      data: {
        name: dto.name,
        projectId: dto.projectId,
        isDefault: boardCount === 0,
        order: boardCount,
        columns: {
          create: columns.map((column, index) => ({
            name: column.name,
            color: column.color || '#6b7280',
            status: column.status,
            order: column.order ?? index,
          })),
        },
      },
      include: this.boardInclude(),
    });
  }

  async findByProject(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);

    let boards = await this.prisma.board.findMany({
      where: { projectId },
      include: this.boardInclude(),
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    if (boards.length === 0) {
      await this.createDefaultBoard(projectId);
      boards = await this.prisma.board.findMany({
        where: { projectId },
        include: this.boardInclude(),
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return boards;
  }

  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: this.boardInclude(),
    });
    if (!board) throw new NotFoundException('Board nao encontrado');

    await this.assertProjectAccess(board.projectId, userId);
    return board;
  }

  async update(id: string, dto: UpdateBoardDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.board.update({
      where: { id },
      data: {
        name: dto.name,
        order: dto.order,
      },
      include: this.boardInclude(),
    });
  }

  async setDefault(id: string, userId: string) {
    const board = await this.findOne(id, userId);

    await this.prisma.$transaction([
      this.prisma.board.updateMany({
        where: { projectId: board.projectId },
        data: { isDefault: false },
      }),
      this.prisma.board.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const board = await this.findOne(id, userId);
    if (board.isDefault) {
      throw new BadRequestException('Nao e possivel excluir o board padrao');
    }

    await this.prisma.board.delete({ where: { id } });
    return { message: 'Board excluido' };
  }

  async addColumn(boardId: string, dto: CreateColumnDto, userId: string) {
    const board = await this.findOne(boardId, userId);
    const maxOrder = board.columns.reduce((max, column) => Math.max(max, column.order), -1);

    return this.prisma.boardColumn.create({
      data: {
        name: dto.name,
        color: dto.color || '#6b7280',
        status: dto.status,
        order: dto.order ?? maxOrder + 1,
        boardId,
      },
    });
  }

  async updateColumn(columnId: string, dto: UpdateColumnDto, userId: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Coluna nao encontrada');

    await this.assertProjectAccess(column.board.projectId, userId);

    const updated = await this.prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        name: dto.name,
        color: dto.color,
        status: dto.status,
        order: dto.order,
      },
    });

    if (dto.status && dto.status !== column.status) {
      await this.prisma.task.updateMany({
        where: { boardColumnId: columnId },
        data: { status: dto.status },
      });
    }

    return updated;
  }

  async removeColumn(columnId: string, userId: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: {
            columns: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!column) throw new NotFoundException('Coluna nao encontrada');

    await this.assertProjectAccess(column.board.projectId, userId);
    if (column.board.columns.length <= 1) {
      throw new BadRequestException('Board deve ter pelo menos uma coluna');
    }

    const fallback = column.board.columns.find((candidate) => candidate.id !== columnId);
    if (fallback) {
      await this.prisma.task.updateMany({
        where: { boardColumnId: columnId },
        data: {
          boardColumnId: fallback.id,
          status: fallback.status,
        },
      });
    }

    await this.prisma.boardColumn.delete({ where: { id: columnId } });
    return { message: 'Coluna excluida' };
  }

  async assignTask(boardId: string, dto: AssignTaskDto, userId: string) {
    const board = await this.findOne(boardId, userId);
    const column = board.columns.find((candidate) => candidate.id === dto.columnId);
    if (!column) {
      throw new BadRequestException('Coluna nao pertence ao board informado');
    }

    const task = await this.prisma.task.findUnique({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException('Tarefa nao encontrada');
    if (task.projectId !== board.projectId) {
      throw new BadRequestException('Tarefa nao pertence ao projeto do board');
    }

    const updated = await this.prisma.task.update({
      where: { id: dto.taskId },
      data: {
        boardColumnId: column.id,
        status: column.status,
        position: dto.position ?? Date.now(),
      },
      include: this.taskInclude(),
    });

    if (task.boardColumnId !== column.id) {
      await this.prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId,
          field: 'boardColumn',
          oldValue: task.boardColumnId,
          newValue: column.id,
        },
      });
    }
    if (task.status !== column.status) {
      await this.prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId,
          field: 'status',
          oldValue: task.status,
          newValue: column.status,
        },
      });
    }

    return updated;
  }

  private boardInclude() {
    return {
      columns: {
        orderBy: { order: 'asc' as const },
        include: {
          _count: { select: { tasks: true } },
        },
      },
    };
  }

  private taskInclude() {
    return {
      assignedTo: { select: { id: true, username: true, name: true, avatar: true } },
      createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      boardColumn: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    };
  }

  private async assertProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Acesso negado ao projeto');
  }
}
