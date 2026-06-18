import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyBackup() {
    this.logger.log('Iniciando backup diário...');
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const dbFile = path.join(this.backupDir, `db-backup-${date}.sql`);
    const archiveFile = path.join(this.backupDir, `backup-${date}.tar.gz`);

    try {
      await this.backupDatabase(dbFile);
      await this.backupFiles(archiveFile, dbFile);
      await this.cleanupOldBackups();
      this.logger.log('Backup diário concluído');
    } catch (err) {
      this.logger.error('Erro no backup diário', err);
    } finally {
      this.cleanupTemporaryFiles([dbFile, archiveFile]);
    }
  }

  private async backupDatabase(outputPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL não configurado, pulando backup do banco');
      return;
    }

    try {
      execSync(`pg_dump "${databaseUrl}" --no-owner --no-acl -f "${outputPath}"`, {
        timeout: 120000,
        stdio: 'pipe',
      });
      this.logger.log(`Backup do banco salvo em ${outputPath}`);
    } catch {
      this.logger.warn('pg_dump não disponível, salvando schema + dados via Prisma');
      const schema = await this.exportPrismaSchema();
      fs.writeFileSync(outputPath, schema, 'utf-8');
    }
  }

  private async exportPrismaSchema(): Promise<string> {
    const lines: string[] = [];
    const tables = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );

    for (const { table_name } of tables) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "${table_name}"`,
      );
      lines.push(`-- Table: ${table_name}`);
      lines.push(JSON.stringify(rows, null, 2));
      lines.push('');
    }

    return lines.join('\n');
  }

  private async backupFiles(archivePath: string, dbFilePath: string): Promise<void> {
    if (!fs.existsSync(dbFilePath)) return;

    try {
      execSync(
        `tar -czf "${archivePath}" -C "${this.backupDir}" "${path.basename(dbFilePath)}"`,
        { timeout: 60000, stdio: 'pipe' },
      );
      this.logger.log(`Backup completo salvo em ${archivePath}`);

      const stats = fs.statSync(archivePath);
      await this.prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'BACKUP_CREATED',
          entity: 'system',
          entityId: 'backup',
          metadata: JSON.stringify({
            path: archivePath,
            size: stats.size,
            date: new Date().toISOString(),
          }),
        },
      });
    } catch (err) {
      this.logger.error('Erro ao criar arquivo de backup', err);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const files = fs.readdirSync(this.backupDir)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.tar.gz'))
      .map((f) => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    const keep = 7;
    if (files.length > keep) {
      for (const file of files.slice(keep)) {
        fs.unlinkSync(file.path);
        this.logger.log(`Backup antigo removido: ${file.name}`);
      }
    }
  }

  private cleanupTemporaryFiles(files: string[]): void {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async runManualBackup(): Promise<{ path: string; size: number }> {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const dbFile = path.join(this.backupDir, `db-backup-${date}.sql`);
    const archiveFile = path.join(this.backupDir, `backup-${date}.tar.gz`);

    await this.backupDatabase(dbFile);
    await this.backupFiles(archiveFile, dbFile);
    this.cleanupTemporaryFiles([dbFile]);

    const stats = fs.statSync(archiveFile);
    return { path: archiveFile, size: stats.size };
  }
}
