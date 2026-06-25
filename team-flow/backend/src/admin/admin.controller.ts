import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [users, projects, tasks, files] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.task.count(),
      this.prisma.file.count(),
    ]);
    return { users, projects, tasks, files };
  }

  @Get('plans')
  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
      select: {
        id: true, name: true, description: true, maxUsers: true,
        maxStorage: true, maxProjects: true, priceMonthly: true,
        priceYearly: true, features: true, isActive: true,
      },
    });
    return plans.map(p => ({
      ...p,
      maxStorage: Number(p.maxStorage),
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
    }));
  }

  @Get('users')
  async listUsers(@Query('q') q?: string) {
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true, username: true, name: true, email: true, roleType: true,
        isActive: true, emailVerified: true, twoFactorEnabled: true,
        avatar: true, createdAt: true, planId: true,
        plan: { select: { id: true, name: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, name: true, email: true, roleType: true,
        isActive: true, emailVerified: true, twoFactorEnabled: true,
        avatar: true, createdAt: true, planId: true,
        plan: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  @Post('users')
  async createUser(@Body() body: { name: string; email: string; password: string; username?: string; roleType?: string; isActive?: boolean }) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) throw new ConflictException('Email já cadastrado');

    const username = body.username || body.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new ConflictException('Username já está em uso');

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        name: body.name,
        email: body.email,
        password: hashedPassword,
        roleType: body.roleType || 'EMPLOYEE',
        isActive: body.isActive ?? true,
        emailVerified: true,
      },
      select: {
        id: true, username: true, name: true, email: true, roleType: true,
        isActive: true, emailVerified: true, createdAt: true,
      },
    });
    return user;
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; roleType?: string; isActive?: boolean; emailVerified?: boolean; planId?: string | null },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (body.email && body.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
      if (existing) throw new ConflictException('Email já cadastrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.roleType !== undefined && { roleType: body.roleType }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.emailVerified !== undefined && { emailVerified: body.emailVerified }),
        ...(body.planId !== undefined && { planId: body.planId }),
      },
      select: {
        id: true, username: true, name: true, email: true, roleType: true,
        isActive: true, emailVerified: true, twoFactorEnabled: true,
        createdAt: true, planId: true,
      },
    });
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Usuário desativado' };
  }

  // ─── Empresas ───────────────────────────────────────────

  @Get('companies')
  async listCompanies() {
    return this.prisma.company.findMany({
      select: {
        id: true, name: true, slug: true, logo: true, createdAt: true,
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, logo: true, createdAt: true,
        members: {
          select: { id: true, role: true, user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: { select: { projects: true } },
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  @Post('companies')
  async createCompany(@Body() body: { name: string }) {
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existing = await this.prisma.company.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Já existe uma empresa com este nome');
    return this.prisma.company.create({
      data: { name: body.name, slug },
      select: { id: true, name: true, slug: true, logo: true, createdAt: true },
    });
  }

  @Patch('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() body: { name?: string; logo?: string }) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    const data: any = {};
    if (body.name !== undefined) {
      data.name = body.name;
      data.slug = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    if (body.logo !== undefined) data.logo = body.logo;
    return this.prisma.company.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, logo: true, createdAt: true },
    });
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    await this.prisma.company.delete({ where: { id } });
    return { message: 'Empresa excluída' };
  }
}
