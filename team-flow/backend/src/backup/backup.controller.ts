import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('backup')
@UseGuards(AuthGuard, RolesGuard)
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Roles('ADMIN')
  @Post('run')
  async runBackup() {
    return this.backupService.runManualBackup();
  }
}
