import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string, @CurrentUser('sub') userId: string) {
    return this.searchService.search(userId, query);
  }
}
