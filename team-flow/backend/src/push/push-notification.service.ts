import { Injectable } from '@nestjs/common';

@Injectable()
export class PushNotificationService {
  async send(userId: string, title: string, body: string, url?: string) {
    console.log(`[Push Notification] To ${userId}: ${title} - ${body}`);
  }
}
