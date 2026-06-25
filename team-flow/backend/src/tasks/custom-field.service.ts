import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PlanLimitsService } from '../common/plan-limits.service';

@Injectable()
export class CustomFieldService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
  ) {}

  async findByProject(projectId: string) {
    return this.prisma.customField.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: { name: string; type: string; required?: boolean; options?: string[]; projectId: string; userId?: string }) {
    const project = await this.prisma.project.findUnique({ where: { id: data.projectId }, select: { ownerId: true } });
    if (project && data.userId) {
      await this.planLimits.assertFeatureAccess(data.userId, 'custom_fields', 'campos personalizados');
    }

    const existing = await this.prisma.customField.findFirst({
      where: { projectId: data.projectId, name: data.name },
    });
    if (existing) throw new Error('Campo com este nome já existe');

    return this.prisma.customField.create({
      data: {
        name: data.name,
        type: data.type,
        required: data.required ?? false,
        options: data.options ? JSON.stringify(data.options) : null,
        projectId: data.projectId,
      },
    });
  }

  async update(id: string, data: { name?: string; type?: string; required?: boolean; options?: string[] }) {
    const field = await this.prisma.customField.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Campo não encontrado');

    return this.prisma.customField.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.options && { options: JSON.stringify(data.options) }),
      },
    });
  }

  async remove(id: string) {
    const field = await this.prisma.customField.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Campo não encontrado');
    await this.prisma.customField.delete({ where: { id } });
    return { message: 'Campo excluído' };
  }

  async setValue(customFieldId: string, taskId: string, value: string) {
    return this.prisma.customFieldValue.upsert({
      where: { customFieldId_taskId: { customFieldId, taskId } },
      create: { customFieldId, taskId, value },
      update: { value },
    });
  }

  async getValues(taskId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { taskId },
      include: { customField: true },
    });
  }
}
