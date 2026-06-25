import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Controller('companies')
export class CompaniesController {
  constructor(private prisma: PrismaService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.prisma.company.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, slug: true, logo: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  @Get()
  async list() {
    return this.prisma.company.findMany({
      select: { id: true, name: true, slug: true, logo: true, createdAt: true, _count: { select: { members: true, projects: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
