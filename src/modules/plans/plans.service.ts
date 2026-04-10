import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PlanStatus } from '@prisma/client';
import { PlansRepository } from './plans.repository';
import { DestinationsService } from '../destinations/destinations.service';
import { UserPlanRecord, BasePlan, PlanCustomData } from './plans.types';
import { PLAN_KEY, PLAN_TTL } from '../../cache/cache.constants';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly destinationsService: DestinationsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findBasePlan(destinationId: string): Promise<BasePlan> {
    const cacheKey = PLAN_KEY(destinationId);
    const cached = await this.cacheManager.get<BasePlan>(cacheKey);
    if (cached) return cached;

    const destination =
      await this.destinationsService.findByIdOrThrow(destinationId);
    const basePlan: BasePlan = {
      destinationId: destination.id,
      destinationName: destination.name,
      country: destination.country,
      itinerary: [],
      attractions: [],
      foodSpots: [],
      startingPrice: destination.startingPrice ?? undefined,
      flightHours: destination.flightHours ?? undefined,
    };

    await this.cacheManager.set(cacheKey, basePlan, PLAN_TTL * 1000);
    return basePlan;
  }

  async findUserPlans(userId: string): Promise<UserPlanRecord[]> {
    return this.plansRepository.findByUserId(userId);
  }

  async findUserPlanOrThrow(
    planId: string,
    userId: string,
  ): Promise<UserPlanRecord> {
    const plan = await this.plansRepository.findByIdAndUserId(planId, userId);
    if (!plan) throw new NotFoundException(`Plan ${planId} not found`);
    return plan;
  }

  async createUserPlan(
    userId: string,
    destinationId: string,
  ): Promise<UserPlanRecord> {
    return this.plansRepository.create({ userId, destinationId });
  }

  async updateUserPlan(
    planId: string,
    userId: string,
    customData: PlanCustomData,
  ): Promise<UserPlanRecord> {
    const plan = await this.findUserPlanOrThrow(planId, userId);
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT plans can be updated');
    }
    return this.plansRepository.updateCustomData(planId, customData);
  }

  async deleteUserPlan(planId: string, userId: string): Promise<void> {
    const plan = await this.findUserPlanOrThrow(planId, userId);
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT plans can be deleted');
    }
    await this.plansRepository.deleteById(planId);
  }

  async findPlanByIdOrThrow(planId: string): Promise<UserPlanRecord> {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) throw new NotFoundException(`Plan ${planId} not found`);
    return plan;
  }

  async updatePlanStatus(planId: string, status: PlanStatus): Promise<void> {
    await this.plansRepository.updateStatus(planId, status);
  }
}
