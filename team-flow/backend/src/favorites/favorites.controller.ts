import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post('projects/:projectId')
  toggleProject(@CurrentUser('sub') userId: string, @Param('projectId') projectId: string) {
    return this.favoritesService.toggleProject(userId, projectId);
  }

  @Post('tasks/:taskId')
  toggleTask(@CurrentUser('sub') userId: string, @Param('taskId') taskId: string) {
    return this.favoritesService.toggleTask(userId, taskId);
  }

  @Get('projects')
  getFavoriteProjects(@CurrentUser('sub') userId: string) {
    return this.favoritesService.getFavoriteProjects(userId);
  }

  @Get('tasks')
  getFavoriteTasks(@CurrentUser('sub') userId: string) {
    return this.favoritesService.getFavoriteTasks(userId);
  }

  @Get('projects/:projectId')
  isProjectFavorite(@CurrentUser('sub') userId: string, @Param('projectId') projectId: string) {
    return this.favoritesService.isProjectFavorite(userId, projectId).then((fav) => ({ isFavorite: fav }));
  }

  @Get('tasks/:taskId')
  isTaskFavorite(@CurrentUser('sub') userId: string, @Param('taskId') taskId: string) {
    return this.favoritesService.isTaskFavorite(userId, taskId).then((fav) => ({ isFavorite: fav }));
  }
}
