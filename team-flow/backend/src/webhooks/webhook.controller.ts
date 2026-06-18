import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WebhookService } from '../common/webhook.service';
import { PrismaService } from '../common/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('webhooks')
@UseGuards(AuthGuard)
export class WebhookController {
  constructor(private webhookService: WebhookService, private prisma: PrismaService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.webhookService.findAll(userId);
  }

  @Post()
  create(@Body() data: { url: string; events: string[]; projectId?: string }, @CurrentUser('sub') userId: string) {
    return this.webhookService.create(data, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { url?: string; events?: string[]; active?: boolean }, @CurrentUser('sub') userId: string) {
    return this.webhookService.update(id, userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.webhookService.remove(id, userId);
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    return this.prisma.webhookLog.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
