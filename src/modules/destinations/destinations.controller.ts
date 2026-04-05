import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { DestinationsService } from './destinations.service';
import type {
  DestinationSummary,
  DestinationRecord,
  AttractionPin,
  FoodSpotPin,
  MapData,
} from './destinations.types';

@Public()
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get()
  async findAll(): Promise<DestinationSummary[]> {
    return this.destinationsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<DestinationRecord> {
    return this.destinationsService.findByIdOrThrow(id);
  }

  @Get(':id/attractions')
  async findAttractions(@Param('id') id: string): Promise<AttractionPin[]> {
    return this.destinationsService.findAttractions(id);
  }

  @Get(':id/food-spots')
  async findFoodSpots(@Param('id') id: string): Promise<FoodSpotPin[]> {
    return this.destinationsService.findFoodSpots(id);
  }

  @Get(':id/map-data')
  async findMapData(@Param('id') id: string): Promise<MapData | null> {
    return this.destinationsService.findMapData(id);
  }
}
