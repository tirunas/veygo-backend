import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAttractionInput, UpdateAttractionInput } from './attractions.types';

@Injectable()
export class AttractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDestination(destinationId: string) {
    return this.prisma.attraction.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPinsByDestination(destinationId: string) {
    return this.prisma.attraction.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      select: { id: true, name: true, lat: true, lng: true, category: true, img: true },
    });
  }

  async findById(id: string) {
    return this.prisma.attraction.findUnique({ where: { id } });
  }

  async create(input: CreateAttractionInput) {
    const { destinationId, content, ...data } = input;
    void destinationId;
    return this.prisma.attraction.create({
      data: { ...data, content: (content ?? {}) as any },
    });
  }

  async update(id: string, input: UpdateAttractionInput) {
    const { content, ...data } = input;
    return this.prisma.attraction.update({
      where: { id },
      data: content !== undefined ? { ...data, content: content as any } : data,
    });
  }

  async delete(id: string) {
    await this.prisma.destinationAttraction.deleteMany({ where: { attractionId: id } });
    await this.prisma.attraction.delete({ where: { id } });
  }

  async findLinkedDestinationIds(attractionId: string): Promise<string[]> {
    const rows = await this.prisma.destinationAttraction.findMany({
      where: { attractionId },
      select: { destinationId: true },
    });
    return rows.map((r) => r.destinationId);
  }
}
