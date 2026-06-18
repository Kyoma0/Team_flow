import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; projectId: string; createdById: string; memberIds?: string[] }) {
    return this.prisma.group.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        createdById: data.createdById,
        members: {
          create: [{ userId: data.createdById }, ...(data.memberIds?.filter((id) => id !== data.createdById).map((id) => ({ userId: id })) || [])],
        },
      },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
    });
  }

  async findOrCreateDM(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new ForbiddenException('Não pode DM você mesmo');

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');

    const sortedIds = [userId, targetUserId].sort();
    const dmName = `__dm__:${sortedIds[0]}:${sortedIds[1]}`;

    const existing = await this.prisma.group.findFirst({
      where: { name: dmName },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
    });
    if (existing) return existing;

    const dmProject = await this.prisma.project.findFirst({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
    if (!dmProject) throw new ForbiddenException('Você precisa estar em um projeto para usar DM');

    return this.prisma.group.create({
      data: {
        name: dmName,
        projectId: dmProject.id,
        createdById: userId,
        members: {
          create: [
            { userId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
    });
  }

  async findUserDMs(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        name: { startsWith: '__dm__' },
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return groups.map((g) => {
      const otherMember = g.members.find((m) => m.userId !== userId);
      return { ...g, dmTarget: otherMember?.user || null };
    });
  }

  async findByProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    return this.prisma.group.findMany({
      where: { projectId },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
        _count: { select: { messages: true } },
      },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Você não é membro deste grupo');

    return group;
  }

  async join(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (existing) throw new ConflictException('Você já é membro deste grupo');

    return this.prisma.groupMember.create({
      data: { groupId: id, userId },
      include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
    });
  }

  async leave(id: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!member) throw new NotFoundException('Você não é membro deste grupo');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    });
    return { message: 'Você saiu do grupo' };
  }

  async remove(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    if (group.createdById !== userId) throw new ForbiddenException('Apenas o criador pode excluir o grupo');
    await this.prisma.group.delete({ where: { id } });
    return { message: 'Grupo excluído' };
  }
}
