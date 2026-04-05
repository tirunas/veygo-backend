import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PlansService } from './plans.service';
import type { BasePlan } from './plans.types';

@Public()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get(':destinationId')
  async findBasePlan(
    @Param('destinationId') destinationId: string,
  ): Promise<BasePlan> {
    return this.plansService.findBasePlan(destinationId);
  }
}
