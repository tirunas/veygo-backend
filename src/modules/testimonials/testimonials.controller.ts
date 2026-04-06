import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { TestimonialsService } from './testimonials.service';

@Controller('testimonials')
@Public()
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
