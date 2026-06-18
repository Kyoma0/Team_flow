import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MinioService } from './minio.service';

@Injectable()
export class TrashService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async moveFileToTrash(fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return null;

    await this.prisma.auditLog.create({
      data: {
        userId: file.uploadedById,
        action: 'FILE_DELETED',
        entity: 'file',
        entityId: fileId,
        metadata: JSON.stringify({
          name: file.originalName,
          key: file.key,
          size: file.size,
          projectId: file.projectId,
          deletedAt: new Date().toISOString(),
        }),
      },
    });

    return file;
  }

  async restoreFile(auditLogId: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id: auditLogId } });
    if (!log || log.action !== 'FILE_DELETED') return null;

    const metadata = JSON.parse(log.metadata || '{}');
    const { key, projectId, name } = metadata;

    const existing = await this.prisma.file.findFirst({ where: { key } });
    if (existing) return existing;

    const result = await this.minio.download(key);
    if (!result.exists) return null;

    const file = await this.prisma.file.create({
      data: {
        name: key,
        originalName: name || key,
        mimeType: 'application/octet-stream',
        size: metadata.size || 0,
        key,
        projectId: projectId || '',
        uploadedById: log.userId,
      },
    });

    return file;
  }

  async listTrash(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { roleType: true } });
    const isAdmin = user?.roleType === 'ADMIN';

    return this.prisma.auditLog.findMany({
      where: {
        action: 'FILE_DELETED',
        ...(isAdmin ? {} : { userId }),
      },
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async permanentlyDelete(auditLogId: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id: auditLogId } });
    if (!log || log.action !== 'FILE_DELETED') return null;

    const metadata = JSON.parse(log.metadata || '{}');
    if (metadata.key) {
      await this.minio.remove(metadata.key);
    }

    await this.prisma.auditLog.delete({ where: { id: auditLogId } });
    return { message: 'Arquivo excluído permanentemente' };
  }

  async emptyTrash(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { roleType: true } });
    const isAdmin = user?.roleType === 'ADMIN';

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'FILE_DELETED',
        ...(isAdmin ? {} : { userId }),
      },
    });

    for (const log of logs) {
      const metadata = JSON.parse(log.metadata || '{}');
      if (metadata.key) {
        await this.minio.remove(metadata.key);
      }
    }

    const ids = logs.map((l) => l.id);
    await this.prisma.auditLog.deleteMany({ where: { id: { in: ids } } });

    return { message: `${logs.length} arquivos excluídos permanentemente` };
  }
}
