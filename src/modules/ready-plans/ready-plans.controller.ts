import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ReadyPlansService } from './ready-plans.service';

@Public()
@Controller('ready-plans')
export class ReadyPlansController {
  constructor(private readonly service: ReadyPlansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
