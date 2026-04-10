import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PoiRepositoryBase } from '../../common/base/poi.repository.base';
import type { CreateRestaurantInput, UpdateRestaurantInput } from './restaurants.types';

@Injectable()
export class RestaurantsRepository extends PoiRepositoryBase {
  constructor(protected readonly prisma: PrismaService) {
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
    const { destinationId: _destinationId, ...data } = input as CreateRestaurantInput & { destinationId?: string };
    return this.prisma.restaurant.create({ data: data as any });
  }

  async update(id: string, input: UpdateRestaurantInput) {
    return this.prisma.restaurant.update({ where: { id }, data: input as any });
  }
}
