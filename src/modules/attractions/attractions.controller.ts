import { Controller, Get, Query } from '@nestjs/common';
import { AttractionsService } from './attractions.service';

@Controller('attractions')
export class AttractionsController {
  constructor(private readonly service: AttractionsService) {}

  @Get()
  findByDestination(@Query('destinationId') destinationId: string) {
    return this.service.findByDestination(destinationId);
  }
}
