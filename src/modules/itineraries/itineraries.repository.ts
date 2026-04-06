import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateItineraryInput, UpdateItineraryInput } from './itineraries.types';

@Injectable()
export class ItinerariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.itinerary.findUnique({
      where: { id },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
  }

  async findAll() {
    return this.prisma.itinerary.findMany({
      include: { segments: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateItineraryInput) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.itinerary.create({
      data: data as any,
      include: { segments: true },
    });
  }

  async update(id: string, data: UpdateItineraryInput) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.itinerary.update({
      where: { id },
      data: data as any,
      include: { segments: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.itinerary.delete({ where: { id } });
  }
}
