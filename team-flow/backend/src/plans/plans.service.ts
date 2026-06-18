import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AsaasService } from './asaas.service';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private prisma: PrismaService,
    private asaasService: AsaasService,
  ) {}

  async findAll() {
    const plans = await this.prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
    return plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features),
      maxStorage: Number(p.maxStorage),
    }));
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return { ...plan, features: JSON.parse(plan.features), maxStorage: Number(plan.maxStorage) };
  }

  create(data: { name: string; description?: string; maxUsers: number; maxStorage: number; maxProjects: number; priceMonthly?: number; priceYearly?: number; features?: string }) {
    return this.prisma.plan.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data: { isActive: false } });
  }

  async getUserPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        planId: true,
        storageUsed: true,
        plan: true,
        planSubscription: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        _count: { select: { ownedProjects: true, memberships: true } },
      },
    });

    if (!user || !user.plan) throw new NotFoundException('User or plan not found');

    return {
      plan: user.plan,
      subscription: user.planSubscription[0] || null,
      usage: {
        storageUsed: Number(user.storageUsed),
        projects: user._count.ownedProjects,
        members: user._count.memberships,
      },
    };
  }

  async checkout(userId: string, planId: string, billingCycle: 'monthly' | 'yearly') {
    const plan = await this.findOne(planId);
    if (!plan.isActive) throw new BadRequestException('Plano não disponível');
    if (plan.priceMonthly === 0) {
      return this.assignPlan(userId, planId);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    let customerId: string | undefined;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId, status: { not: 'CANCELLED' } },
    });
    if (existingSub?.customerId) {
      customerId = existingSub.customerId;
    } else {
      customerId = await this.asaasService.createCustomer(user);
    }

    const sub = await this.asaasService.createSubscription(customerId, { priceMonthly: plan.priceMonthly, name: plan.name }, billingCycle);

    if (this.asaasService.mockMode) {
      await this.prisma.subscription.upsert({
        where: { id: `mock_${userId}_${planId}` },
        create: {
          id: `mock_${userId}_${planId}`,
          userId,
          planId,
          status: 'ACTIVE',
          provider: 'asaas',
          providerId: sub.id,
          customerId,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
        update: { status: 'ACTIVE', planId },
      });
      await this.assignPlan(userId, planId);
    }

    return {
      checkoutUrl: sub.paymentUrl,
      subscriptionId: sub.id,
      mockMode: this.asaasService.mockMode,
    };
  }

  async assignPlan(userId: string, planId: string) {
    const plan = await this.findOne(planId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const oldPlanId = user.planId;

    await this.prisma.user.update({
      where: { id: userId },
      data: { planId },
    });

    await this.prisma.planHistory.create({
      data: {
        planId,
        userId,
        action: oldPlanId ? 'UPGRADE' : 'ASSIGN',
        data: JSON.stringify({
          oldPlanId,
          newPlanId: planId,
          planName: plan.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    this.logger.log(`Plano do usuário ${userId} alterado para ${plan.name} (${planId})`);

    return { message: `Plano alterado para ${plan.name}` };
  }

  async handleAsaasWebhook(event: string, body: any) {
    this.logger.log(`Webhook ASAAS recebido: ${event}`);

    if (event === 'PAYMENT_CONFIRMED' || event === 'RECEIVED') {
      const subscriptionId = body.subscription?.[0]?.id || body.subscription;
      if (!subscriptionId) return { received: true };

      const sub = await this.prisma.subscription.findFirst({
        where: { providerId: subscriptionId },
        include: { plan: true },
      });
      if (sub) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          },
        });
        await this.assignPlan(sub.userId, sub.planId);
      }
    }

    if (event === 'PAYMENT_OVERDUE') {
      const subscriptionId = body.subscription?.[0]?.id || body.subscription;
      if (!subscriptionId) return { received: true };

      const sub = await this.prisma.subscription.findFirst({
        where: { providerId: subscriptionId },
      });
      if (sub) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'OVERDUE' },
        });
      }
    }

    if (event === 'SUBSCRIPTION_CANCELED' || event === 'PAYMENT_REFUNDED') {
      const subscriptionId = body.subscription?.[0]?.id || body.subscription || body.id;
      if (!subscriptionId) return { received: true };

      const sub = await this.prisma.subscription.findFirst({
        where: { providerId: subscriptionId },
      });
      if (sub) {
        const freePlan = await this.prisma.plan.findFirst({
          where: { priceMonthly: 0, isActive: true },
        });
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        if (freePlan) {
          await this.assignPlan(sub.userId, freePlan.id);
        }
      }
    }

    return { received: true };
  }

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: { not: 'CANCELLED' } },
      include: { plan: true },
    });
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { not: 'CANCELLED' } },
    });
    if (!sub) throw new NotFoundException('Nenhuma assinatura ativa encontrada');

    if (!this.asaasService.mockMode && sub.providerId) {
      await this.asaasService.cancelSubscription(sub.providerId);
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    const freePlan = await this.prisma.plan.findFirst({
      where: { priceMonthly: 0, isActive: true },
    });
    if (freePlan) {
      await this.assignPlan(userId, freePlan.id);
    }

    return { message: 'Assinatura cancelada. Você foi movido para o plano Gratuito.' };
  }
}
