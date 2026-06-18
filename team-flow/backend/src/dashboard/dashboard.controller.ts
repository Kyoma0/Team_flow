import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getStats(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getStats(userId);
  }
}
