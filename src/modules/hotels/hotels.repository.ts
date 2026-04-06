import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PoiRepositoryBase } from '../../common/base/poi.repository.base';
import type { CreateHotelInput, UpdateHotelInput } from './hotels.types';

@Injectable()
export class HotelsRepository extends PoiRepositoryBase {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getTableName(): 'hotel' {
    return 'hotel';
  }

  protected getJoinTableName(): 'destinationHotel' {
    return 'destinationHotel';
  }

  protected getJoinTableIdField(): string {
    return 'hotelId';
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
}
