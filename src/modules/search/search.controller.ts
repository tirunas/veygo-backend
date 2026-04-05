import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SearchService } from './search.service';
import { DestinationSummary } from '../destinations/destinations.types';

@Public()
@Controller('destinations')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  async search(
    @Query('q') query?: string,
    @Query('styles') styles?: string,
    @Query('origin') origin?: string,
  ): Promise<DestinationSummary[]> {
    const styleList = styles
      ? styles.split(',').map((s) => s.trim())
      : undefined;
    return this.searchService.search({ query, styles: styleList, origin });
  }
}
