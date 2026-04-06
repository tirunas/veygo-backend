import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TestimonialsRepository } from './testimonials.repository';
import {
  TESTIMONIALS_LIST_KEY,
  TESTIMONIALS_TTL,
} from '../../cache/cache.constants';
import type {
  Testimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from './testimonials.types';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly repo: TestimonialsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<Testimonial[]> {
    const cached = await this.cacheManager.get<Testimonial[]>(
      TESTIMONIALS_LIST_KEY,
    );
    if (cached) return cached;

    const testimonials = await this.repo.findAll();
    await this.cacheManager.set(
      TESTIMONIALS_LIST_KEY,
      testimonials,
      TESTIMONIALS_TTL * 1000,
    );
    return testimonials as Testimonial[];
  }

  async findById(id: string): Promise<Testimonial> {
    const testimonial = await this.repo.findById(id);
    if (!testimonial) {
      throw new NotFoundException(`Testimonial with id ${id} not found`);
    }
    return testimonial as Testimonial;
  }

  async create(data: CreateTestimonialInput): Promise<Testimonial> {
    const testimonial = await this.repo.create(data);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
    return testimonial as Testimonial;
  }

  async update(
    id: string,
    data: UpdateTestimonialInput,
  ): Promise<Testimonial> {
    const testimonial = await this.repo.update(id, data);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
    return testimonial as Testimonial;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
  }
}
