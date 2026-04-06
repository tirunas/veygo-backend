import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RestaurantsService } from './restaurants.service';

@Public()
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Get()
  findByDestination(@Query('destinationId') destinationId: string) {
    return this.service.findByDestination(destinationId);
  }
}
