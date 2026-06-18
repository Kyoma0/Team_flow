import { Injectable } from '@nestjs/common';

@Injectable()
export class PushService {
  private subscriptions: Map<string, any> = new Map();

  subscribe(userId: string, subscription: any) {
    this.subscriptions.set(userId, subscription);
    return { message: 'Inscrito com sucesso' };
  }

  unsubscribe(userId: string) {
    this.subscriptions.delete(userId);
    return { message: 'Removido com sucesso' };
  }

  async send(userId: string, title: string, body: string, url?: string) {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return;

    try {
      const { webpush } = await import('web-push');

      webpush.setVapidDetails(
        'mailto:noreply@teamflow.com',
        process.env.VAPID_PUBLIC_KEY || 'BIl1v7qFJgPqYqFJgPqYqFJgPqYqFJgPqYqFJgPqYqA',
        process.env.VAPID_PRIVATE_KEY || 'mock-private-key',
      );

      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title, body, url }),
      );
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Push] Notificação para ${userId}: ${title} - ${body}`);
      }
    }
  }

  async sendToMany(userIds: string[], title: string, body: string, url?: string) {
    return Promise.allSettled(
      userIds.map((id) => this.send(id, title, body, url)),
    );
  }
}
