import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ExperiencesService } from './experiences.service';
import type { Experience } from './experiences.types';

@Controller('experiences')
@Public()
export class ExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Get()
  findAll(@Query('destinationId') destinationId?: string): Promise<Experience[]> {
    return this.service.findAll(destinationId);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Experience> {
    return this.service.findById(id);
  }
}
