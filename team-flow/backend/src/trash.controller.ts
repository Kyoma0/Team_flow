import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { TrashService } from './common/trash.service';
import { AuthGuard } from './common/guards/auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller('trash')
@UseGuards(AuthGuard)
export class TrashController {
  constructor(private trashService: TrashService) {}

  @Get()
  listTrash(@CurrentUser('sub') userId: string) {
    return this.trashService.listTrash(userId);
  }

  @Post(':id/restore')
  restoreFile(@Param('id') id: string) {
    return this.trashService.restoreFile(id);
  }

  @Delete(':id')
  permanentlyDelete(@Param('id') id: string) {
    return this.trashService.permanentlyDelete(id);
  }

  @Delete()
  emptyTrash(@CurrentUser('sub') userId: string) {
    return this.trashService.emptyTrash(userId);
  }
}
