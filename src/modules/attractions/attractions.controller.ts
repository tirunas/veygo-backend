import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AttractionsService } from './attractions.service';

@Public()
@Controller('attractions')
export class AttractionsController {
  constructor(private readonly service: AttractionsService) {}

  @Get()
  findByDestination(@Query('destinationId') destinationId: string) {
    return this.service.findByDestination(destinationId);
  }
}
