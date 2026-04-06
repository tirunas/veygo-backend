import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateTestimonialInput, UpdateTestimonialInput } from './testimonials.types';

@Injectable()
export class TestimonialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.testimonial.findMany();
  }

  async findById(id: string) {
    return this.prisma.testimonial.findUnique({
      where: { id },
    });
  }

  async create(data: CreateTestimonialInput) {
    return this.prisma.testimonial.create({
      data,
    });
  }

  async update(id: string, data: UpdateTestimonialInput) {
    return this.prisma.testimonial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.testimonial.delete({
      where: { id },
    });
  }
}
