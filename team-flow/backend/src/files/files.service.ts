import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import { PlanLimitsService } from '../common/plan-limits.service';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
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

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { company: true, owner: true },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    const companyName = project.company?.name || project.owner.name;
    const userIdentifier = project.owner.username || project.owner.email;
    const ext = path.extname(file.originalname);
    const fileName = `${uuid()}${ext}`;
    const relativePath = this.storage.getRelativePath(companyName, userIdentifier, fileName);

    await this.storage.upload(file.buffer, companyName, userIdentifier, fileName, file.mimetype);

    const newFile = await this.prisma.file.create({
      data: {
        name: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key: relativePath,
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
        key: relativePath,
        fileId: newFile.id,
        uploadedById: userId,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: file.size } },
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

    const fullPath = this.storage.getFullPath(file.key);
    const result = await this.storage.download(fullPath);
    if (!result.exists || !result.stream) throw new NotFoundException('Arquivo não encontrado no armazenamento');

    return { file, stream: result.stream };
  }

  async remove(id: string, userId: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');

    const fullPath = this.storage.getFullPath(file.key);
    await this.storage.remove(fullPath);
    await this.prisma.file.delete({ where: { id } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: file.size } },
    });
    return { message: 'Arquivo excluído' };
  }

  async uploadVersion(id: string, file: Express.Multer.File, userId: string) {
    const existing = await this.prisma.file.findUnique({
      where: { id },
      include: { project: { include: { company: true, owner: true } } },
    });
    if (!existing) throw new NotFoundException('Arquivo não encontrado');

    const companyName = existing.project.company?.name || existing.project.owner.name;
    const userIdentifier = existing.project.owner.username || existing.project.owner.email;
    const ext = path.extname(file.originalname);
    const newVersion = existing.version + 1;
    const fileName = `${uuid()}${ext}`;
    const relativePath = this.storage.getRelativePath(companyName, userIdentifier, fileName);

    await this.storage.upload(file.buffer, companyName, userIdentifier, fileName, file.mimetype);

    await this.prisma.fileVersion.create({
      data: {
        version: newVersion,
        name: fileName,
        originalName: file.originalname,
        size: file.size,
        key: relativePath,
        fileId: id,
        uploadedById: userId,
      },
    });

    const sizeDiff = file.size - existing.size;
    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: sizeDiff } },
    });

    return this.prisma.file.update({
      where: { id },
      data: {
        name: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key: relativePath,
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

    const fullPath = this.storage.getFullPath(version.key || version.name);
    const result = await this.storage.download(fullPath);
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
