import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PoiRepositoryBase } from '../../common/base/poi.repository.base';
import type { CreateRestaurantInput, UpdateRestaurantInput } from './restaurants.types';

@Injectable()
export class RestaurantsRepository extends PoiRepositoryBase {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getTableName(): 'restaurant' {
    return 'restaurant';
  }

  protected getJoinTableName(): 'destinationRestaurant' {
    return 'destinationRestaurant';
  }

  protected getJoinTableIdField(): string {
    return 'restaurantId';
  }

  async findPinsByDestination(destinationId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      select: { id: true, name: true, lat: true, lng: true, type: true, price: true },
    });
  }

  async create(input: CreateRestaurantInput) {
    const { destinationId: _destinationId, signature, reviews, ...data } = input;
    const content = { signature, reviews };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.restaurant.create({
      data: { ...data, content: content as any },
    });
  }

  async update(id: string, input: UpdateRestaurantInput) {
    const { signature, reviews, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const updates: any = { ...data };
    if (signature !== undefined || reviews !== undefined) {
      updates.content = { signature, reviews };
    }
    return this.prisma.restaurant.update({
      where: { id },
      data: updates,
    });
  }
}
