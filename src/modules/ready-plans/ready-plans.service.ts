import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReadyPlansRepository } from './ready-plans.repository';
import {
  READY_PLANS_LIST_KEY,
  READY_PLAN_KEY,
  READY_PLAN_TTL,
} from '../../cache/cache.constants';
import type {
  ReadyPlan,
  CreateReadyPlanInput,
  UpdateReadyPlanInput,
} from './ready-plans.types';

@Injectable()
export class ReadyPlansService {
  constructor(
    private readonly repo: ReadyPlansRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<ReadyPlan[]> {
    const cached = await this.cacheManager.get<ReadyPlan[]>(READY_PLANS_LIST_KEY);
    if (cached) return cached;

    const plans = await this.repo.findAll();
    await this.cacheManager.set(
      READY_PLANS_LIST_KEY,
      plans,
      READY_PLAN_TTL * 1000,
    );
    return plans as ReadyPlan[];
  }

  async findById(id: string): Promise<ReadyPlan> {
    const cached = await this.cacheManager.get<ReadyPlan>(READY_PLAN_KEY(id));
    if (cached) return cached;

    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundException(`ReadyPlan ${id} not found`);

    await this.cacheManager.set(READY_PLAN_KEY(id), plan, READY_PLAN_TTL * 1000);
    return plan as ReadyPlan;
  }

  async create(data: CreateReadyPlanInput): Promise<ReadyPlan> {
    const plan = await this.repo.create(data);
    await this.cacheManager.del(READY_PLANS_LIST_KEY);
    return plan as ReadyPlan;
  }

  async update(id: string, data: UpdateReadyPlanInput): Promise<ReadyPlan> {
    const plan = await this.repo.update(id, data);
    await this.bustCaches(id);
    return plan as ReadyPlan;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.bustCaches(id);
  }

  async setPublished(id: string, isPublished: boolean): Promise<ReadyPlan> {
    const plan = await this.repo.setPublished(id, isPublished);
    await this.bustCaches(id);
    return plan as ReadyPlan;
  }

  private async bustCaches(id: string): Promise<void> {
    await Promise.all([
      this.cacheManager.del(READY_PLANS_LIST_KEY),
      this.cacheManager.del(READY_PLAN_KEY(id)),
    ]);
  }
}
