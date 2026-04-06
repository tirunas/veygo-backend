import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ExperiencesRepository } from './experiences.repository';
import {
  EXPERIENCES_LIST_KEY,
  EXPERIENCE_KEY,
  EXPERIENCE_TTL,
} from '../../cache/cache.constants';
import type {
  Experience,
  CreateExperienceInput,
  UpdateExperienceInput,
} from './experiences.types';

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly repo: ExperiencesRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(destinationId?: string): Promise<Experience[]> {
    const cacheKey = destinationId
      ? `${EXPERIENCES_LIST_KEY}:${destinationId}`
      : EXPERIENCES_LIST_KEY;

    const cached = await this.cacheManager.get<Experience[]>(cacheKey);
    if (cached) return cached;

    const experiences = await this.repo.findAll(destinationId);
    await this.cacheManager.set(cacheKey, experiences, EXPERIENCE_TTL * 1000);
    return experiences;
  }

  async findById(id: string): Promise<Experience> {
    const cacheKey = EXPERIENCE_KEY(id);
    const cached = await this.cacheManager.get<Experience>(cacheKey);
    if (cached) return cached;

    const experience = await this.repo.findById(id);
    if (!experience) {
      throw new NotFoundException(`Experience ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, experience, EXPERIENCE_TTL * 1000);
    return experience;
  }

  async create(data: CreateExperienceInput): Promise<Experience> {
    const experience = await this.repo.create(data);
    await this.cacheManager.del(EXPERIENCES_LIST_KEY);
    return experience;
  }

  async update(id: string, data: UpdateExperienceInput): Promise<Experience> {
    const experience = await this.repo.update(id, data);
    await this.bustCaches(id);
    return experience;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.bustCaches(id);
  }

  private async bustCaches(id: string): Promise<void> {
    await Promise.all([
      this.cacheManager.del(EXPERIENCES_LIST_KEY),
      this.cacheManager.del(EXPERIENCE_KEY(id)),
    ]);
  }
}
