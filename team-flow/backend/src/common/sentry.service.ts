import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SentryService {
  private logger = new Logger('SentryService');
  private enabled = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      try {
        this.enabled = true;
        this.logger.log('Sentry initialized');
      } catch (err) {
        this.logger.warn('Failed to initialize Sentry');
      }
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.enabled) {
      this.logger.error(`[Sentry Mock] ${error.message}`, error.stack);
      return;
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.enabled) {
      this.logger.log(`[Sentry Mock] ${level}: ${message}`);
      return;
    }
  }
}
