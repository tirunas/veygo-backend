import { Controller, Get, Post, Param, Query, Headers, HttpCode, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { DestinationsService } from './destinations.service';
import { DestinationDetailService } from './destination-detail.service';
import { searchDestinationsSchema } from './dto/search-destinations.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type {
  DestinationSummary,
  DestinationRecord,
  DestinationSearchResult,
  MapData,
} from './destinations.types';

@Public()
@Controller('destinations')
export class DestinationsController {
  constructor(
    private readonly destinationsService: DestinationsService,
    private readonly destinationDetailService: DestinationDetailService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async findAll(): Promise<DestinationSummary[]> {
    return this.destinationsService.findAll();
  }

  @Get('search')
  async search(
    @Query(new ZodValidationPipe(searchDestinationsSchema)) dto: any,
  ): Promise<DestinationSearchResult[]> {
    return this.destinationsService.search(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<DestinationRecord> {
    return this.destinationsService.findByIdOrThrow(id);
  }

  @Get(':id/attractions')
  async findAttractions(@Param('id') id: string) {
    return this.destinationDetailService.findAttractions(id);
  }

  @Get(':id/food-spots')
  async findFoodSpots(@Param('id') id: string) {
    return this.destinationDetailService.findFoodSpots(id);
  }

  @Get(':id/map-data')
  async findMapData(@Param('id') id: string): Promise<MapData | null> {
    return this.destinationDetailService.findMapData(id);
  }

  @Post(':id/revalidate')
  @Public()
  @HttpCode(204)
  async revalidateCache(
    @Param('id') id: string,
    @Headers('x-directus-secret') secret: string,
  ): Promise<void> {
    const expected = this.config.get<string>('DIRECTUS_WEBHOOK_SECRET');
    if (!expected || secret !== expected) throw new ForbiddenException();
    await this.destinationsService.invalidateCache(id);
  }
}
