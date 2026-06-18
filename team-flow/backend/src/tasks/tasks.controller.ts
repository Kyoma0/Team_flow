import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(AuthGuard)
@ApiTags('Tarefas')
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('my')
  @ApiOperation({ summary: 'Tarefas do usuário atual' })
  async myTasks(@CurrentUser('sub') userId: string) {
    return this.tasksService.findByUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar tarefa', description: 'Cria uma nova tarefa no projeto especificado' })
  @ApiBody({ type: CreateTaskDto })
  @ApiCreatedResponse({ description: 'Tarefa criada com sucesso' })
  create(@Body() data: CreateTaskDto, @CurrentUser('sub') userId: string) {
    return this.tasksService.create({ ...data, createdById: userId });
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Listar tarefas de um projeto', description: 'Retorna tarefas filtradas por projeto com paginação e filtros' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status (pending, in_progress, completed, cancelled)' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filtrar por prioridade (low, medium, high, urgent)' })
  @ApiQuery({ name: 'assignedToId', required: false, description: 'Filtrar por usuário responsável' })
  @ApiQuery({ name: 'dueDateFrom', required: false, description: 'Data de vencimento inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dueDateTo', required: false, description: 'Data de vencimento final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (padrão: 50)' })
  @ApiResponse({ status: 200, description: 'Lista de tarefas com paginação' })
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.findByProject(
      projectId, userId,
      { status, priority, assignedToId, dueDateFrom, dueDateTo },
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter tarefa por ID', description: 'Retorna os detalhes de uma tarefa específica' })
  @ApiParam({ name: 'id', description: 'ID da tarefa' })
  @ApiResponse({ status: 200, description: 'Dados da tarefa' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa', description: 'Atualiza os campos de uma tarefa existente' })
  @ApiParam({ name: 'id', description: 'ID da tarefa' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada com sucesso' })
  update(@Param('id') id: string, @Body() data: UpdateTaskDto, @CurrentUser('sub') userId: string) {
    return this.tasksService.update(id, userId, data);
  }

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Adicionar dependência', description: 'Adiciona uma dependência entre tarefas' })
  @ApiParam({ name: 'id', description: 'ID da tarefa' })
  @ApiBody({ description: 'ID da tarefa da qual depender', schema: { properties: { dependsOnId: { type: 'string' } } } })
  @ApiCreatedResponse({ description: 'Dependência adicionada com sucesso' })
  addDependency(@Param('id') id: string, @Body() data: { dependsOnId: string }, @CurrentUser('sub') userId: string) {
    return this.tasksService.addDependency(id, data.dependsOnId, userId);
  }

  @Delete('dependencies/:id')
  @ApiOperation({ summary: 'Remover dependência', description: 'Remove uma dependência de tarefa' })
  @ApiParam({ name: 'id', description: 'ID da dependência' })
  @ApiResponse({ status: 200, description: 'Dependência removida com sucesso' })
  removeDependency(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.tasksService.removeDependency(id, userId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Operações em lote nas tarefas' })
  async bulkOperation(
    @Body() body: { taskIds: string[]; action: string; value: string },
  ) {
    return this.tasksService.bulkOperation(body.taskIds, body.action, body.value);
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Mover tarefa para lixeira' })
  softDelete(@Param('id') id: string) {
    return this.tasksService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar tarefa da lixeira' })
  restore(@Param('id') id: string) {
    return this.tasksService.restore(id);
  }

  @Get('project/:projectId/trash')
  @ApiOperation({ summary: 'Listar tarefas na lixeira' })
  getTrash(@Param('projectId') projectId: string) {
    return this.tasksService.getTrash(projectId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir tarefa', description: 'Remove permanentemente uma tarefa' })
  @ApiParam({ name: 'id', description: 'ID da tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa excluída com sucesso' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.tasksService.remove(id, userId);
  }
}
