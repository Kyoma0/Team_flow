import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  create(@Body() data: { name: string; description?: string; permissions?: string[] }) {
    return this.rolesService.create(data);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; description?: string; permissions?: string[] }) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
