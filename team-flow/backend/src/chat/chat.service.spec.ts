import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../common/prisma.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: any;

  const mockPrisma = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should create a message with correct data and include user/file relations', async () => {
      const dto = { content: 'Hello', groupId: 'group-1', userId: 'user-1', fileId: 'file-1' };
      const expected = {
        id: 'msg-1',
        ...dto,
        user: { id: 'user-1', username: 'john', name: 'John', avatar: null },
        file: { id: 'file-1', originalName: 'doc.pdf', size: 100, mimeType: 'application/pdf' },
      };

      mockPrisma.message.create.mockResolvedValue(expected);

      const result = await service.sendMessage(dto);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: dto,
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          file: { select: { id: true, originalName: true, size: true, mimeType: true } },
        },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getMessages', () => {
    it('should return messages ordered by createdAt desc', async () => {
      const messages = [
        { id: 'msg-2', content: 'Second', createdAt: new Date('2024-01-02') },
        { id: 'msg-1', content: 'First', createdAt: new Date('2024-01-01') },
      ];

      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessages('group-1', 50);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { groupId: 'group-1' },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          file: { select: { id: true, originalName: true, size: true, mimeType: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(messages);
    });

    it('should apply before filter when provided', async () => {
      const beforeDate = '2024-01-15T00:00:00Z';

      await service.getMessages('group-1', 20, beforeDate);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-1', createdAt: { lt: new Date(beforeDate) } },
          take: 20,
        }),
      );
    });
  });

  describe('searchMessages', () => {
        it('should filter by groupId and content contains', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      await service.searchMessages('group-1', 'hello');

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          groupId: 'group-1',
          content: { contains: 'hello' },
        },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          file: { select: { id: true, originalName: true, size: true, mimeType: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });
});
