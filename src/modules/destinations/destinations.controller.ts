import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
