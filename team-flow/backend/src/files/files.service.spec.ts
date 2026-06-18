import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { PlanLimitsService } from '../common/plan-limits.service';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;
  let minio: any;
  let planLimits: any;

  const mockPrisma = {
    file: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    fileVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockMinio = {
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
  };

  const mockPlanLimits = {
    checkStorageLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MinioService, useValue: mockMinio },
        { provide: PlanLimitsService, useValue: mockPlanLimits },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get(PrismaService);
    minio = module.get(MinioService);
    planLimits = module.get(PlanLimitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    const mockFile = {
      originalname: 'document.pdf',
      buffer: Buffer.from('test'),
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    it('should create file record after checking storage and uploading to minio', async () => {
      const expectedFile = {
        id: 'file-1',
        name: expect.stringMatching(/^[0-9a-f-]+\.pdf$/),
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        key: expect.stringMatching(/^[0-9a-f-]+\.pdf$/),
        projectId: 'project-1',
        taskId: null,
        groupId: null,
        uploadedById: 'user-1',
        uploadedBy: { id: 'user-1', username: 'john', name: 'John', avatar: null },
      };

      mockPrisma.file.create.mockResolvedValue(expectedFile);

      const result = await service.upload(mockFile, 'project-1', 'user-1');

      expect(mockPlanLimits.checkStorageLimit).toHaveBeenCalledWith('user-1', 1024);
      expect(mockMinio.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^[0-9a-f-]+\.pdf$/),
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(mockPrisma.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          projectId: 'project-1',
          uploadedById: 'user-1',
        }),
        include: {
          uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
        },
      });
      expect(mockPrisma.fileVersion.create).toHaveBeenCalledWith({
        data: {
          version: 1,
          name: expect.stringMatching(/^[0-9a-f-]+\.pdf$/),
          originalName: 'document.pdf',
          size: 1024,
          key: expect.stringMatching(/^[0-9a-f-]+\.pdf$/),
          fileId: 'file-1',
          uploadedById: 'user-1',
        },
      });
      expect(result).toEqual(expectedFile);
    });
  });

  describe('findByProject', () => {
    it('should return files for project with pagination', async () => {
      const files = [
        { id: 'file-1', originalName: 'doc.pdf' },
        { id: 'file-2', originalName: 'image.png' },
      ];

      mockPrisma.file.findMany.mockResolvedValue(files);
      mockPrisma.file.count.mockResolvedValue(2);

      const result = await service.findByProject('project-1', 1, 10);

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: {
          uploadedBy: { select: { id: true, username: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ files, total: 2, page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return file with versions', async () => {
      const file = {
        id: 'file-1',
        originalName: 'doc.pdf',
        uploadedBy: { id: 'user-1', name: 'John', avatar: null },
        versions: [{ version: 1, name: 'v1.pdf' }],
      };

      mockPrisma.file.findUnique.mockResolvedValue(file);

      const result = await service.findOne('file-1');

      expect(mockPrisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
          versions: { orderBy: { version: 'desc' } },
        },
      });
      expect(result).toEqual(file);
    });

    it('should throw NotFoundException when file does not exist', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVersions', () => {
    it('should return versions for a file', async () => {
      const versions = [
        { id: 'v2', version: 2, uploadedBy: { name: 'Jane' } },
        { id: 'v1', version: 1, uploadedBy: { name: 'John' } },
      ];
      mockPrisma.fileVersion.findMany.mockResolvedValue(versions);

      const result = await service.getVersions('file-1');

      expect(mockPrisma.fileVersion.findMany).toHaveBeenCalledWith({
        where: { fileId: 'file-1' },
        orderBy: { version: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(versions);
    });
  });

  describe('getVersion', () => {
    it('should return a single version by id', async () => {
      const version = { id: 'v1', version: 1, name: 'old.pdf' };
      mockPrisma.fileVersion.findUnique.mockResolvedValue(version);

      const result = await service.getVersion('v1');

      expect(mockPrisma.fileVersion.findUnique).toHaveBeenCalledWith({ where: { id: 'v1' } });
      expect(result).toEqual(version);
    });
  });

  describe('downloadVersion', () => {
    it('should return version file stream from minio', async () => {
      const version = { id: 'v1', key: 'old-key.pdf', name: 'old-key.pdf', originalName: 'old.pdf' };
      const stream = { pipe: jest.fn() };
      mockPrisma.fileVersion.findUnique.mockResolvedValue(version);
      mockMinio.download.mockResolvedValue({ exists: true, stream });

      const result = await service.downloadVersion('v1');

      expect(mockMinio.download).toHaveBeenCalledWith('old-key.pdf');
      expect(result).toEqual({ version, stream });
    });

    it('should throw NotFoundException when version not found', async () => {
      mockPrisma.fileVersion.findUnique.mockResolvedValue(null);
      await expect(service.downloadVersion('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when file not in storage', async () => {
      mockPrisma.fileVersion.findUnique.mockResolvedValue({ id: 'v1', key: 'key' } as any);
      mockMinio.download.mockResolvedValue({ exists: false, stream: null });
      await expect(service.downloadVersion('v1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete file from minio and database', async () => {
      const file = { id: 'file-1', name: 'abc.pdf' };

      mockPrisma.file.findUnique.mockResolvedValue(file);

      const result = await service.remove('file-1', 'user-1');

      expect(mockMinio.remove).toHaveBeenCalledWith('abc.pdf');
      expect(mockPrisma.file.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
      expect(result).toEqual({ message: 'Arquivo excluído' });
    });

    it('should throw NotFoundException when file does not exist', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
