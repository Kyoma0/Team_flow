import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';

@Injectable()
export class CleanupService {
  private logger = new Logger('CleanupService');

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredData() {
    this.logger.log('Iniciando limpeza de dados expirados...');

    const expiredInvites = await this.prisma.invite.deleteMany({
      where: {
        acceptedAt: null,
        expiresAt: { lt: new Date() },
      },
    });
    if (expiredInvites.count > 0) {
      this.logger.log(`${expiredInvites.count} convites expirados removidos`);
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldLogs = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    if (oldLogs.count > 0) {
      this.logger.log(`${oldLogs.count} logs de auditoria antigos removidos`);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldMessages = await this.prisma.message.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });
    if (oldMessages.count > 0) {
      this.logger.log(`${oldMessages.count} mensagens antigas removidas`);
    }

    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const oldTimeEntries = await this.prisma.timeEntry.deleteMany({
      where: { createdAt: { lt: oneYearAgo } },
    });
    if (oldTimeEntries.count > 0) {
      this.logger.log(`${oldTimeEntries.count} registros de tempo antigos removidos`);
    }

    this.logger.log('Limpeza concluída');
  }
}
