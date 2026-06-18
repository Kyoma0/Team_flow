import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PlanLimitsService } from './plan-limits.service';
import { PrismaService } from './prisma.service';

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    projectMember: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlanLimitsService>(PlanLimitsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkStorageLimit', () => {
    it('should allow when under limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsed: 500,
        plan: { maxStorage: 1000 },
      });

      await expect(
        service.checkStorageLimit('user-1', 200),
      ).resolves.toBeUndefined();
    });

    it('should allow when exactly at limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsed: 800,
        plan: { maxStorage: 1000 },
      });

      await expect(
        service.checkStorageLimit('user-1', 200),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when over limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsed: 900,
        plan: { maxStorage: 1000 },
      });

      await expect(
        service.checkStorageLimit('user-1', 200),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return early when user has no plan', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsed: 999999,
        plan: null,
      });

      await expect(
        service.checkStorageLimit('user-1', 999999),
      ).resolves.toBeUndefined();
    });
  });
});
