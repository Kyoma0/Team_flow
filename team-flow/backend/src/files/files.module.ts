import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageService } from '../common/storage.service';
import { PlanLimitsService } from '../common/plan-limits.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, StorageService, PlanLimitsService],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
