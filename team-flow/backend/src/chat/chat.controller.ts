import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('chat')
@UseGuards(AuthGuard)
@ApiTags('Chat')
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages/:groupId')
  @ApiOperation({ summary: 'Listar mensagens do grupo', description: 'Retorna todas as mensagens de um grupo de chat' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens' })
  getMessages(@Param('groupId') groupId: string) {
    return this.chatService.getMessages(groupId);
  }

  @Get('search/:groupId')
  @ApiOperation({ summary: 'Pesquisar mensagens', description: 'Pesquisa mensagens em um grupo pelo conteúdo' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiQuery({ name: 'q', description: 'Termo de busca' })
  @ApiResponse({ status: 200, description: 'Resultados da busca' })
  searchMessages(@Param('groupId') groupId: string, @Query('q') q: string) {
    return this.chatService.searchMessages(groupId, q);
  }
}
