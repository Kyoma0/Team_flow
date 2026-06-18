import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PlanLimitsService {
  constructor(private prisma: PrismaService) {}

  async checkProjectLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user?.plan) return;

    const projectCount = await this.prisma.project.count({
      where: { ownerId: userId },
    });

    if (projectCount >= user.plan.maxProjects) {
      throw new ForbiddenException(
        `Limite de projetos atingido (${user.plan.maxProjects}). Faça upgrade do seu plano.`,
      );
    }
  }

  async checkMemberLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user?.plan) return;

    const memberCount = await this.prisma.projectMember.count({
      where: { project: { ownerId: userId } },
    });

    if (memberCount >= user.plan.maxUsers) {
      throw new ForbiddenException(
        `Limite de membros atingido (${user.plan.maxUsers}). Faça upgrade do seu plano.`,
      );
    }
  }

  async checkStorageLimit(userId: string, additionalBytes: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user?.plan) return;

    const storageUsed = Number(user.storageUsed);
    const maxStorage = Number(user.plan.maxStorage);

    if (storageUsed + additionalBytes > maxStorage) {
      const maxMB = Math.round(maxStorage / (1024 * 1024));
      throw new ForbiddenException(
        `Limite de armazenamento atingido (${maxMB}MB). Faça upgrade do seu plano.`,
      );
    }
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user?.plan) return false;

    const features: string[] = JSON.parse(user.plan.features);
    return features.includes(feature) || features.includes('all');
  }

  async assertFeatureAccess(userId: string, feature: string, featureLabel?: string) {
    const hasAccess = await this.checkFeatureAccess(userId, feature);
    if (!hasAccess) {
      throw new ForbiddenException(
        `Seu plano não inclui ${featureLabel || feature}. Faça upgrade para acessar este recurso.`,
      );
    }
  }
}
