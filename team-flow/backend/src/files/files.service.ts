import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { PlanLimitsService } from '../common/plan-limits.service';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private planLimits: PlanLimitsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    projectId: string,
    userId: string,
    taskId?: string,
    groupId?: string,
  ) {
    await this.planLimits.checkStorageLimit(userId, file.size);
    const ext = path.extname(file.originalname);
    const fileName = `${uuid()}${ext}`;

    await this.minio.upload(fileName, file.buffer, file.mimetype);

    const newFile = await this.prisma.file.create({
      data: {
        name: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key: fileName,
        projectId,
        taskId,
        groupId,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    await this.prisma.fileVersion.create({
      data: {
        version: 1,
        name: fileName,
        originalName: file.originalname,
        size: file.size,
        key: fileName,
        fileId: newFile.id,
        uploadedById: userId,
      },
    });

    return newFile;
  }

  async findByProject(projectId: string, page = 1, limit = 50) {
    const where = { projectId };
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.file.count({ where }),
    ]);
    return { files, total, page, limit };
  }

  async findByTask(taskId: string) {
    return this.prisma.file.findMany({
      where: { taskId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.file.findMany({
      where: { groupId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async download(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');

    const result = await this.minio.download(file.name);
    if (!result.exists || !result.stream) throw new NotFoundException('Arquivo não encontrado no armazenamento');

    return { file, stream: result.stream };
  }

  async remove(id: string, userId: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');

    await this.minio.remove(file.name);
    await this.prisma.file.delete({ where: { id } });
    return { message: 'Arquivo excluído' };
  }

  async uploadVersion(id: string, file: Express.Multer.File, userId: string) {
    const existing = await this.prisma.file.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Arquivo não encontrado');

    const ext = path.extname(file.originalname);
    const newVersion = existing.version + 1;
    const fileName = `${uuid()}${ext}`;

    await this.minio.upload(fileName, file.buffer, file.mimetype);

    await this.prisma.fileVersion.create({
      data: {
        version: existing.version,
        name: existing.name,
        originalName: existing.originalName,
        size: existing.size,
        key: existing.key,
        fileId: id,
        uploadedById: userId,
      },
    });

    return this.prisma.file.update({
      where: { id },
      data: {
        name: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key: fileName,
        version: newVersion,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async getVersions(fileId: string) {
    return this.prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async getVersion(versionId: string) {
    return this.prisma.fileVersion.findUnique({ where: { id: versionId } });
  }

  async downloadVersion(versionId: string) {
    const version = await this.prisma.fileVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException('Versão não encontrada');

    const result = await this.minio.download(version.key || version.name);
    if (!result.exists || !result.stream)
      throw new NotFoundException('Arquivo não encontrado no armazenamento');

    return { version, stream: result.stream };
  }

  async findOne(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        versions: { orderBy: { version: 'desc' } },
      },
    });
    if (!file) throw new NotFoundException('Arquivo não encontrado');
    return file;
  }
}
