import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRestaurantInput, UpdateRestaurantInput } from './restaurants.types';

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDestination(destinationId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPinsByDestination(destinationId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      select: { id: true, name: true, lat: true, lng: true, type: true, price: true },
    });
  }

  async findById(id: string) {
    return this.prisma.restaurant.findUnique({ where: { id } });
  }

  async create(input: CreateRestaurantInput) {
    const { destinationId: _destinationId, content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.restaurant.create({
      data: { ...data, content: (content ?? {}) as any },
    });
  }

  async update(id: string, input: UpdateRestaurantInput) {
    const { content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.restaurant.update({
      where: { id },
      data: content !== undefined ? { ...data, content: content as any } : data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.destinationRestaurant.deleteMany({ where: { restaurantId: id } });
    await this.prisma.restaurant.delete({ where: { id } });
  }

  async findLinkedDestinationIds(restaurantId: string): Promise<string[]> {
    const rows = await this.prisma.destinationRestaurant.findMany({
      where: { restaurantId },
      select: { destinationId: true },
    });
    return rows.map((r) => r.destinationId);
  }
}
