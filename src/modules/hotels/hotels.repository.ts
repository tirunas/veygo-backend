import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateHotelInput, UpdateHotelInput } from './hotels.types';

@Injectable()
export class HotelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDestination(destinationId: string) {
    return this.prisma.hotel.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPinsByDestination(destinationId: string) {
    return this.prisma.hotel.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        tier: true,
        pricePerNight: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.hotel.findUnique({ where: { id } });
  }

  async create(input: CreateHotelInput) {
    const { destinationId: _destinationId, content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.hotel.create({
      data: { ...data, content: (content ?? {}) as any },
    });
  }

  async update(id: string, input: UpdateHotelInput) {
    const { content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.hotel.update({
      where: { id },
      data: content !== undefined ? { ...data, content: content as any } : data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.destinationHotel.deleteMany({ where: { hotelId: id } });
    await this.prisma.hotel.delete({ where: { id } });
  }

  async findLinkedDestinationIds(hotelId: string): Promise<string[]> {
    const rows = await this.prisma.destinationHotel.findMany({
      where: { hotelId },
      select: { destinationId: true },
    });
    return rows.map((r) => r.destinationId);
  }
}
