import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PlanLimitsService } from '../common/plan-limits.service';
import { BoardsService } from '../boards/boards.service';
import { StorageService } from '../common/storage.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
    private boardsService: BoardsService,
    private storageService: StorageService,
  ) {}

  async create(data: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    ownerId: string;
  }) {
    await this.planLimits.checkProjectLimit(data.ownerId);
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        clientId: data.clientId || null,
        ownerId: data.ownerId,
        members: {
          create: { userId: data.ownerId, role: 'owner' },
        },
      },
      include: {
        owner: { select: { id: true, username: true, name: true, email: true, avatar: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, email: true, avatar: true } } } },
        client: { select: { id: true, name: true, company: true } },
      },
    });
    await this.boardsService.createDefaultBoard(project.id);
    this.storageService.ensureDir(this.storageService.sanitize(project.name));
    return project;
  }

  async findAll(userId: string, page?: number, limit?: number) {
    const where = { members: { some: { userId } } };

    const [projects, total, stats] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, username: true, name: true, email: true, avatar: true } },
          members: { include: { user: { select: { id: true, username: true, name: true, email: true, avatar: true } } } },
          client: { select: { id: true, name: true, company: true } },
          _count: { select: { tasks: true, members: true, groups: true } },
        },
        orderBy: { updatedAt: 'desc' },
        ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      this.prisma.project.count({ where }),
      this.getProjectStats(userId),
    ]);

    return {
      projects,
      stats,
      pagination: page && limit ? { page, limit, total, pages: Math.ceil(total / limit) } : undefined,
    };
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, username: true, name: true, email: true, avatar: true, roleType: true } } },
        },
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true, files: true, groups: true } },
      },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Você não é membro deste projeto');

    return project;
  }

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (project.ownerId !== userId) throw new ForbiddenException('Apenas o dono pode editar o projeto');

    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        owner: { select: { id: true, username: true, name: true, email: true, avatar: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, email: true, avatar: true } } } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (project.ownerId !== userId) throw new ForbiddenException('Apenas o dono pode excluir o projeto');
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Projeto excluído' };
  }

  async archive(id: string, userId: string) {
    return this.update(id, userId, { status: 'ARCHIVED' });
  }

  async addMember(projectId: string, userId: string, memberId: string, username?: string) {
    await this.planLimits.checkMemberLimit(userId);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    const isOwner = project.ownerId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!isOwner && !isMember) throw new ForbiddenException('Sem permissão');

    let targetUserId = memberId;
    if (!targetUserId && username) {
      const user = await this.prisma.user.findUnique({ where: { username } });
      if (!user) throw new NotFoundException('Usuário não encontrado');
      targetUserId = user.id;
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (existing) throw new NotFoundException('Usuário já é membro');

    return this.prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role: 'member' },
      include: { user: { select: { id: true, username: true, name: true, email: true, avatar: true } } },
    });
  }

  async removeMember(projectId: string, userId: string, memberId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (project.ownerId !== userId) throw new ForbiddenException('Apenas o dono pode remover membros');
    if (project.ownerId === memberId) throw new ForbiddenException('Não pode remover o dono');

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } },
    });
    return { message: 'Membro removido' };
  }

  private async getProjectStats(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { tasks: true } } },
    });

    const total = projects.length;
    const active = projects.filter((p) => p.status === 'ACTIVE').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    const archived = projects.filter((p) => p.status === 'ARCHIVED').length;

    const tasks = await this.prisma.task.findMany({
      where: { project: { members: { some: { userId } } } },
      select: { status: true },
    });

    const taskStats = {
      total: tasks.length,
      notStarted: tasks.filter((t) => t.status === 'NOT_STARTED').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      paused: tasks.filter((t) => t.status === 'PAUSED').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    };

    return { total, active, completed, archived, tasks: taskStats };
  }
}
