import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('boards')
@UseGuards(AuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() dto: CreateBoardDto, @CurrentUser('sub') userId: string) {
    return this.boardsService.create(dto, userId);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @CurrentUser('sub') userId: string) {
    return this.boardsService.findByProject(projectId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.boardsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBoardDto, @CurrentUser('sub') userId: string) {
    return this.boardsService.update(id, dto, userId);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.boardsService.setDefault(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.boardsService.remove(id, userId);
  }

  @Post(':id/columns')
  addColumn(@Param('id') boardId: string, @Body() dto: CreateColumnDto, @CurrentUser('sub') userId: string) {
    return this.boardsService.addColumn(boardId, dto, userId);
  }

  @Post(':id/tasks')
  assignTask(@Param('id') boardId: string, @Body() dto: AssignTaskDto, @CurrentUser('sub') userId: string) {
    return this.boardsService.assignTask(boardId, dto, userId);
  }

  @Patch('columns/:columnId')
  updateColumn(@Param('columnId') columnId: string, @Body() dto: UpdateColumnDto, @CurrentUser('sub') userId: string) {
    return this.boardsService.updateColumn(columnId, dto, userId);
  }

  @Delete('columns/:columnId')
  removeColumn(@Param('columnId') columnId: string, @CurrentUser('sub') userId: string) {
    return this.boardsService.removeColumn(columnId, userId);
  }
}
