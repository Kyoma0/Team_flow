import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AuthOrApiTokenGuard } from '../common/guards/auth-or-api-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(AuthOrApiTokenGuard)
@ApiTags('Projetos')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar projeto', description: 'Cria um novo projeto' })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: 'Projeto criado com sucesso' })
  create(@Body() data: CreateProjectDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.create({ ...data, ownerId: userId });
  }

  @Get()
  @ApiOperation({ summary: 'Listar projetos', description: 'Lista todos os projetos do usuário com paginação' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista de projetos' })
  findAll(@CurrentUser('sub') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.projectsService.findAll(userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter projeto por ID', description: 'Retorna os detalhes de um projeto específico' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Dados do projeto' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar projeto', description: 'Atualiza os dados de um projeto existente' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Projeto atualizado com sucesso' })
  update(@Param('id') id: string, @Body() data: UpdateProjectDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.update(id, userId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir projeto', description: 'Remove permanentemente um projeto' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto excluído com sucesso' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.remove(id, userId);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Arquivar projeto', description: 'Arquiva um projeto para ocultá-lo da lista principal' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto arquivado com sucesso' })
  archive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.archive(id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Adicionar membro', description: 'Adiciona um membro a um projeto' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiBody({ type: AddMemberDto })
  @ApiCreatedResponse({ description: 'Membro adicionado com sucesso' })
  addMember(@Param('id') id: string, @Body() body: AddMemberDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.addMember(id, userId, body.userId || '', body.username);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remover membro', description: 'Remove um membro de um projeto' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiParam({ name: 'memberId', description: 'ID do membro' })
  @ApiResponse({ status: 200, description: 'Membro removido com sucesso' })
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.removeMember(id, userId, memberId);
  }
}
