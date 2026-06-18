import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from './prisma.service';

describe('EmailService', () => {
  let service: EmailService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        notifyTaskAssigned: true,
        notifyTaskStatus: true,
        notifyDeliveryStatus: true,
        notifyMentioned: true,
        notifyCommentReply: true,
      }),
    },
  };

  beforeEach(() => {
    jest.resetModules();
    mockPrisma.user.findUnique.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SMTP_HOST;
  });

  describe('when SMTP_HOST is not set', () => {
    beforeEach(async () => {
      delete process.env.SMTP_HOST;
      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      service = module.get<EmailService>(EmailService);
    });

    it('sendTaskNotification should log to console', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await service.sendTaskNotification(
        'assigned',
        'user@example.com',
        'Test Task',
        'Project X',
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Email] Simulado'),
      );
      expect(result).toEqual({ messageId: 'simulado' });
      logSpy.mockRestore();
    });

    it('sendDeliveryNotification should log to console', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await service.sendDeliveryNotification(
        'user@example.com',
        'Delivery 1',
        'IN_PRODUCTION',
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Email] Simulado'),
      );
      expect(result).toEqual({ messageId: 'simulado' });
      logSpy.mockRestore();
    });
  });

  describe('when SMTP_HOST is set', () => {
    const OLD_ENV = process.env;

    beforeEach(async () => {
      process.env = { ...OLD_ENV };
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      service = module.get<EmailService>(EmailService);
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('sendTaskNotification should call send with correct params', async () => {
      const sendSpy = jest.spyOn(service as any, 'send').mockResolvedValue({ messageId: 'real-id' });

      const result = await service.sendTaskNotification(
        'assigned',
        'user@example.com',
        'Test Task',
        'Project X',
      );

      expect(sendSpy).toHaveBeenCalledWith(
        'user@example.com',
        'Nova tarefa: Test Task - TeamFlow',
        expect.stringContaining('Test Task'),
      );
      expect(result).toEqual({ messageId: 'real-id' });
      sendSpy.mockRestore();
    });

    it('sendDeliveryNotification should call send with correct params', async () => {
      const sendSpy = jest.spyOn(service as any, 'send').mockResolvedValue({ messageId: 'real-id' });

      const result = await service.sendDeliveryNotification(
        'user@example.com',
        'Delivery 1',
        'IN_PRODUCTION',
      );

      expect(sendSpy).toHaveBeenCalledWith(
        'user@example.com',
        'Entrega: Delivery 1 - TeamFlow',
        expect.stringContaining('Delivery 1'),
      );
      expect(result).toEqual({ messageId: 'real-id' });
      sendSpy.mockRestore();
    });
  });
});
