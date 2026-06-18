import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string; permissions?: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Cargo já existe');
    return this.prisma.role.create({
      data: { name: data.name, description: data.description, permissions: JSON.stringify(data.permissions || []) },
    });
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return roles.map((r) => ({ ...r, permissions: JSON.parse(r.permissions) }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Cargo não encontrado');
    return { ...role, permissions: JSON.parse(role.permissions) };
  }

  async update(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Cargo não encontrado');
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions !== undefined) updateData.permissions = JSON.stringify(data.permissions);
    return this.prisma.role.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Cargo não encontrado');
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Cargo removido' };
  }
}
