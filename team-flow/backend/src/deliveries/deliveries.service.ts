import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email.service';
import { WebhookService } from '../common/webhook.service';

const deliveryInclude = {
  createdBy: { select: { id: true, username: true, name: true, avatar: true } },
  reviewedBy: { select: { id: true, username: true, name: true, avatar: true } },
  files: true,
  versions: {
    include: { uploadedBy: { select: { id: true, username: true, name: true, avatar: true } } },
    orderBy: { version: 'desc' as const },
  },
};

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private emailService: EmailService,
    private webhookService: WebhookService,
  ) {}

  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    dueDate?: string;
    createdById: string;
  }) {
    const delivery = await this.prisma.delivery.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'IN_PRODUCTION',
        projectId: data.projectId,
        createdById: data.createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        versions: {
          create: {
            version: 1,
            uploadedById: data.createdById,
          },
        },
      },
      include: deliveryInclude,
    });

    return delivery;
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    return this.prisma.delivery.findMany({
      where: { projectId },
      include: deliveryInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');

    const project = await this.prisma.project.findUnique({
      where: { id: delivery.projectId },
      include: { members: { where: { userId } } },
    });
    if (!project || project.members.length === 0) throw new ForbiddenException('Acesso negado');

    return delivery;
  }

  async updateStatus(id: string, userId: string, status: string, reviewNote?: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id }, include: { project: true } });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');

    const data: any = { status };
    if (status === 'APPROVED' || status === 'FINALIZED') {
      data.reviewedById = userId;
      data.reviewedAt = new Date();
    }
    if (reviewNote) {
      data.reviewNote = reviewNote;
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data,
      include: deliveryInclude,
    });

    const statusMessages: Record<string, string> = {
      APPROVED: 'foi aprovada',
      CHANGES_REQUESTED: 'teve correção solicitada',
      IN_REVIEW: 'foi enviada para revisão',
      FINALIZED: 'foi finalizada',
    };

    const msg = statusMessages[status];
    if (msg && delivery.createdById !== userId) {
      await this.notifications.create({
        type: status === 'APPROVED' ? 'delivery_approved' : 'delivery_correction',
        content: `Entrega "${delivery.title}" ${msg}`,
        recipientId: delivery.createdById,
        senderId: userId,
        projectId: delivery.projectId,
        deliveryId: id,
      });

      const creator = await this.prisma.user.findUnique({ where: { id: delivery.createdById }, select: { email: true } });
      if (creator?.email) {
        await this.emailService.sendDeliveryNotification(creator.email, delivery.title, status).catch(() => {});
      }
    }

    await this.webhookService.dispatch('delivery.status_changed', updated, delivery.projectId).catch(() => {});

    return updated;
  }

  async addVersion(id: string, userId: string, note?: string, files?: string[]) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');

    const lastVersion = await this.prisma.deliveryVersion.findFirst({
      where: { deliveryId: id },
      orderBy: { version: 'desc' },
    });

    const version = await this.prisma.deliveryVersion.create({
      data: {
        version: (lastVersion?.version ?? 0) + 1,
        note,
        deliveryId: id,
        uploadedById: userId,
        files: JSON.stringify(files ?? []),
      },
      include: {
        uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return this.prisma.delivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });
  }

  async remove(id: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (delivery.createdById !== userId && user?.roleType !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador ou administrador pode excluir a entrega');
    }

    await this.prisma.delivery.delete({ where: { id } });
    return { message: 'Entrega excluída' };
  }
}
