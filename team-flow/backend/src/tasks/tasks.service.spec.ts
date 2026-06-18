import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email.service';
import { WebhookService } from '../common/webhook.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;
  let notifications: any;
  let emailService: any;
  let webhookService: any;

  const mockPrisma = {
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskHistory: {
      create: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockNotifications = {
    create: jest.fn(),
  };

  const mockEmailService = {
    sendTaskNotification: jest.fn().mockResolvedValue(undefined),
    notifyTaskWatchers: jest.fn().mockResolvedValue(undefined),
  };

  const mockWebhookService = {
    dispatch: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: EmailService, useValue: mockEmailService },
        { provide: WebhookService, useValue: mockWebhookService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
    emailService = module.get(EmailService);
    webhookService = module.get(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Task',
      description: 'Desc',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      projectId: 'project-1',
      assignedToId: 'user-2',
      createdById: 'user-1',
    };

    const mockTask = {
      id: 'task-1',
      title: 'New Task',
      description: 'Desc',
      status: 'NOT_STARTED',
      priority: 'HIGH',
      projectId: 'project-1',
      assignedToId: 'user-2',
      createdById: 'user-1',
      assignedTo: { id: 'user-2', username: 'jane', name: 'Jane', avatar: null },
      createdBy: { id: 'user-1', username: 'john', name: 'John', avatar: null },
    };

    it('should create a task and send notification + email when assigned to different user', async () => {
      mockPrisma.task.create.mockResolvedValue(mockTask);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ email: 'jane@example.com' });
      mockPrisma.project.findUnique.mockResolvedValueOnce({ name: 'Projeto Teste' });

      const result = await service.create(createDto);

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Task',
          description: 'Desc',
          status: 'NOT_STARTED',
          priority: 'HIGH',
          projectId: 'project-1',
          assignedToId: 'user-2',
          createdById: 'user-1',
        }),
        include: expect.any(Object),
      });
      expect(mockPrisma.taskHistory.create).toHaveBeenCalledWith({
        data: { taskId: 'task-1', userId: 'user-1', field: 'created', oldValue: undefined, newValue: 'NOT_STARTED' },
      });
      expect(mockNotifications.create).toHaveBeenCalledWith({
        type: 'task_new',
        content: `Você recebeu uma nova tarefa: ${mockTask.title}`,
        recipientId: 'user-2',
        senderId: 'user-1',
        projectId: 'project-1',
        taskId: 'task-1',
      });
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        select: { name: true },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: { email: true },
      });
      expect(mockEmailService.sendTaskNotification).toHaveBeenCalledWith(
        'assigned',
        'jane@example.com',
        mockTask.title,
        'Projeto Teste',
      );
      expect(result).toEqual(mockTask);
    });

    it('should NOT send notification or email when assigned to self', async () => {
      const selfDto = { ...createDto, assignedToId: 'user-1' };
      mockPrisma.task.create.mockResolvedValue({ ...mockTask, assignedToId: 'user-1' });

      await service.create(selfDto);

      expect(mockNotifications.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendTaskNotification).not.toHaveBeenCalled();
    });
  });

  describe('findByProject', () => {
    it('should apply filters and pagination', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        members: [{ userId: 'user-1' }],
      });
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const filters = { status: 'IN_PROGRESS', priority: 'HIGH', assignedToId: 'user-2' };

      await service.findByProject('project-1', 'user-1', filters, 2, 10);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          deletedAt: null,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedToId: 'user-2',
        },
        include: expect.any(Object),
        orderBy: { position: 'asc' },
        skip: 10,
        take: 10,
      });
      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          deletedAt: null,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedToId: 'user-2',
        },
      });
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        members: [],
      });

      await expect(
        service.findByProject('project-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        projectId: 'project-1',
      });
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        members: [],
      });

      await expect(
        service.findOne('task-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should send notification and email when status changes and assigned to different user', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Old Task',
        status: 'NOT_STARTED',
        assignedToId: 'user-2',
        projectId: 'project-1',
      };

      mockPrisma.task.findUnique.mockResolvedValueOnce(existingTask);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        status: 'IN_PROGRESS',
        assignedTo: { id: 'user-2', username: 'jane', name: 'Jane', avatar: null },
        createdBy: { id: 'user-1', username: 'john', name: 'John', avatar: null },
      });
      mockPrisma.project.findUnique.mockResolvedValueOnce({ name: 'Projeto Teste' });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ email: 'jane@example.com' });

      await service.update('task-1', 'user-1', { status: 'IN_PROGRESS' });

      expect(mockPrisma.taskHistory.create).toHaveBeenCalledWith({
        data: { taskId: 'task-1', userId: 'user-1', field: 'status', oldValue: 'NOT_STARTED', newValue: 'IN_PROGRESS' },
      });
      expect(mockNotifications.create).toHaveBeenCalledWith({
        type: 'task_status',
        content: `Tarefa "Old Task" mudou para IN_PROGRESS`,
        recipientId: 'user-2',
        senderId: 'user-1',
        projectId: 'project-1',
        taskId: 'task-1',
      });
      expect(mockEmailService.sendTaskNotification).toHaveBeenCalledWith(
        'status_change',
        'jane@example.com',
        'Old Task',
        'Projeto Teste',
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
