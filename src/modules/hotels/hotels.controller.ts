import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { HotelsService } from './hotels.service';

@Public()
@Controller('hotels')
export class HotelsController {
  constructor(private readonly service: HotelsService) {}

  @Get()
  findByDestination(@Query('destinationId') destinationId: string) {
    return this.service.findByDestination(destinationId);
  }
}
