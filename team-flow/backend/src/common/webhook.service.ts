import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.webhook.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { url: string; events: string[]; projectId?: string }, userId: string) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: {
        url: data.url,
        events: JSON.stringify(data.events),
        secret,
        projectId: data.projectId,
        createdById: userId,
      },
    });
  }

  async update(id: string, userId: string, data: { url?: string; events?: string[]; active?: boolean }) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, createdById: userId } });
    if (!webhook) throw new Error('Webhook não encontrado');
    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: JSON.stringify(data.events) }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, createdById: userId } });
    if (!webhook) throw new Error('Webhook não encontrado');
    await this.prisma.webhook.delete({ where: { id } });
    return { message: 'Webhook excluído' };
  }

  async dispatch(event: string, payload: any, projectId?: string) {
    const where: any = { active: true, events: { contains: event } };
    if (projectId) where.projectId = projectId;

    const webhooks = await this.prisma.webhook.findMany({ where });
    if (webhooks.length === 0) return;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

    for (const webhook of webhooks) {
      const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');
      const startTime = Date.now();
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });

        const responseBody = await response.text();
        await this.prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            status: response.status,
            response: responseBody.substring(0, 1000),
            duration: Date.now() - startTime,
          },
        });
      } catch (err: any) {
        await this.prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            status: 0,
            response: err.message?.substring(0, 1000) || 'Erro de conexão',
            duration: Date.now() - startTime,
          },
        });
      }
    }
  }
}
