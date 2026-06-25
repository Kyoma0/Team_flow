import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { BoardsModule } from '../boards/boards.module';
import { AuthOrApiTokenGuard } from '../common/guards/auth-or-api-token.guard';
import { StorageService } from '../common/storage.service';

@Module({
  imports: [BoardsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AuthOrApiTokenGuard, StorageService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
