import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlansService } from './plans.service';
import type { UserPlanRecord, UpdateUserPlanInput } from './plans.types';

const createPlanSchema = z.object({
  destinationId: z.string().min(1),
});

const updatePlanSchema = z.object({
  customData: z.object({
    notes: z.string().optional(),
    selectedActivities: z.array(z.string()).optional(),
    travelDates: z
      .object({ startDate: z.string(), endDate: z.string() })
      .optional(),
    groupSize: z.number().int().positive().optional(),
  }),
});

@Controller('users/me/plans')
export class UserPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { id: string; role: string },
  ): Promise<UserPlanRecord[]> {
    return this.plansService.findUserPlans(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') planId: string,
  ): Promise<UserPlanRecord> {
    return this.plansService.findUserPlanOrThrow(planId, user.id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPlanSchema))
  async create(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: { destinationId: string },
  ): Promise<UserPlanRecord> {
    return this.plansService.createUserPlan(user.id, body.destinationId);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updatePlanSchema))
  async update(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') planId: string,
    @Body() body: UpdateUserPlanInput,
  ): Promise<UserPlanRecord> {
    return this.plansService.updateUserPlan(planId, user.id, body.customData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') planId: string,
  ): Promise<void> {
    await this.plansService.deleteUserPlan(planId, user.id);
  }
}
