import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('calendar')
@UseGuards(AuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  getEvents(
    @CurrentUser('sub') userId: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.calendarService.getEvents(userId, startDate, endDate);
  }
}
