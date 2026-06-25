import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiCreatedResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { AuthOrApiTokenGuard } from '../common/guards/auth-or-api-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';

@Controller('files')
@UseGuards(AuthOrApiTokenGuard)
@ApiTags('Arquivos')
@ApiBearerAuth()
export class FilesController {
  constructor(
    private filesService: FilesService,
    private auditService: AuditService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de arquivo', description: 'Faz upload de um arquivo para um projeto, tarefa ou grupo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Arquivo para upload', schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiQuery({ name: 'projectId', required: true, description: 'ID do projeto' })
  @ApiQuery({ name: 'taskId', required: false, description: 'ID da tarefa (opcional)' })
  @ApiQuery({ name: 'groupId', required: false, description: 'ID do grupo (opcional)' })
  @ApiCreatedResponse({ description: 'Arquivo enviado com sucesso' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('projectId') projectId: string,
    @Query('taskId') taskId: string,
    @Query('groupId') groupId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const result = await this.filesService.upload(file, projectId, userId, taskId, groupId);
    await this.auditService.log(userId, 'UPLOAD', 'FILE', result.id, `Upload: ${file.originalname}`);
    return result;
  }

  @Post(':id/version')
  @ApiOperation({ summary: 'Upload de versão', description: 'Faz upload de uma nova versão de um arquivo existente' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiBody({ description: 'Nova versão do arquivo', schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ description: 'Versão criada com sucesso' })
  @UseInterceptors(FileInterceptor('file'))
  uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    return this.filesService.uploadVersion(id, file, userId);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Upload de versão (alternativo)', description: 'Endpoint alternativo para upload de nova versão' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiBody({ description: 'Nova versão do arquivo', schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ description: 'Versão criada com sucesso' })
  @UseInterceptors(FileInterceptor('file'))
  uploadVersionAlt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    return this.filesService.uploadVersion(id, file, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Listar versões', description: 'Retorna o histórico de versões de um arquivo' })
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Lista de versões' })
  getVersions(@Param('id') id: string) {
    return this.filesService.getVersions(id);
  }

  @Get('versions/:versionId/download')
  @SkipThrottle()
  @ApiOperation({ summary: 'Download de versão', description: 'Faz o download de uma versão específica do arquivo' })
  @ApiParam({ name: 'versionId', description: 'ID da versão' })
  @ApiResponse({ status: 200, description: 'Arquivo para download' })
  async downloadVersion(@Param('versionId') versionId: string, @Res() res: Response) {
    const { version, stream } = await this.filesService.downloadVersion(versionId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${version.originalName}"`,
    });
    stream.pipe(res);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Listar arquivos do projeto', description: 'Retorna arquivos associados a um projeto' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista de arquivos' })
  findByProject(@Param('projectId') projectId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.filesService.findByProject(projectId, parseInt(page || '1'), parseInt(limit || '50'));
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Listar arquivos da tarefa', description: 'Retorna arquivos associados a uma tarefa' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa' })
  @ApiResponse({ status: 200, description: 'Lista de arquivos' })
  findByTask(@Param('taskId') taskId: string) {
    return this.filesService.findByTask(taskId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Listar arquivos do grupo', description: 'Retorna arquivos associados a um grupo de chat' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiResponse({ status: 200, description: 'Lista de arquivos' })
  findByGroup(@Param('groupId') groupId: string) {
    return this.filesService.findByGroup(groupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter arquivo por ID', description: 'Retorna os metadados de um arquivo específico' })
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Metadados do arquivo' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download de arquivo', description: 'Faz o download de um arquivo' })
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo para download' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { file, stream } = await this.filesService.download(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir arquivo', description: 'Remove permanentemente um arquivo e suas versões' })
  @ApiParam({ name: 'id', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo excluído com sucesso' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.filesService.remove(id, userId);
  }
}
