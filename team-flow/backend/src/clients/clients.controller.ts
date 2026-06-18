import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  create(@Body() data: { name: string; company?: string; email?: string; phone?: string; notes?: string }, @CurrentUser('sub') userId: string) {
    return this.clientsService.create({ ...data, createdById: userId });
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.clientsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.clientsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; company?: string; email?: string; phone?: string; notes?: string }, @CurrentUser('sub') userId: string) {
    return this.clientsService.update(id, userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.clientsService.remove(id, userId);
  }
}
