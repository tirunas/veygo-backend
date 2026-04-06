import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReadyPlanInput, UpdateReadyPlanInput } from './ready-plans.types';

@Injectable()
export class ReadyPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.readyPlan.findMany({
      where: { isPublished: true },
      include: {
        itinerary: {
          include: {
            segments: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.readyPlan.findUnique({
      where: { id },
      include: {
        itinerary: {
          include: {
            segments: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async create(data: CreateReadyPlanInput) {
    return this.prisma.readyPlan.create({
      data,
      include: {
        itinerary: true,
      },
    });
  }

  async update(id: string, data: UpdateReadyPlanInput) {
    return this.prisma.readyPlan.update({
      where: { id },
      data,
      include: {
        itinerary: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.readyPlan.delete({
      where: { id },
    });
  }

  async setPublished(id: string, isPublished: boolean) {
    return this.prisma.readyPlan.update({
      where: { id },
      data: { isPublished },
      include: {
        itinerary: true,
      },
    });
  }
}
