import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as crypto from 'crypto';
import { EmailService } from './email.service';

@Injectable()
export class InviteService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(email: string, role: string, projectId: string | undefined, invitedById: string) {
    const existing = await this.prisma.invite.findFirst({
      where: { email, projectId, acceptedAt: null, expiresAt: { gte: new Date() } },
    });
    if (existing) throw new BadRequestException('Convite já enviado para este email');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: { email, token, role, projectId, invitedById, expiresAt },
    });

    const inviteUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/invite/${token}`;
    await this.emailService.sendEmail(
      email,
      'Convite para o TeamFlow',
      `Você foi convidado para o TeamFlow! Acesse: ${inviteUrl}`,
    );

    return { message: 'Convite enviado', inviteId: invite.id };
  }

  async accept(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.acceptedAt) throw new BadRequestException('Convite já foi aceito');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Convite expirado');

    if (invite.projectId) {
      const existingMember = await this.prisma.projectMember.findFirst({
        where: { projectId: invite.projectId, userId },
      });
      if (!existingMember) {
        await this.prisma.projectMember.create({
          data: { projectId: invite.projectId, userId, role: invite.role as any },
        });
      }
    }

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return { message: 'Convite aceito', projectId: invite.projectId };
  }

  async findByEmail(email: string) {
    return this.prisma.invite.findMany({
      where: { email, acceptedAt: null, expiresAt: { gte: new Date() } },
      include: { project: { select: { name: true } }, invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.invite.findMany({
      where: { projectId },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    await this.prisma.invite.delete({ where: { id } });
    return { message: 'Convite cancelado' };
  }
}
