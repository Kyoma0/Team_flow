import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTokenService } from './api-token.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api-tokens')
@UseGuards(AuthGuard)
export class ApiTokenController {
  constructor(private apiTokenService: ApiTokenService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.apiTokenService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() body: { name: string }) {
    return this.apiTokenService.create(userId, body.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.apiTokenService.remove(id, userId);
  }
}
