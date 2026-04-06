import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PoiRepositoryBase } from '../../common/base/poi.repository.base';
import type { CreateAttractionInput, UpdateAttractionInput } from './attractions.types';

@Injectable()
export class AttractionsRepository extends PoiRepositoryBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getTableName(): 'attraction' {
    return 'attraction';
  }

  protected getJoinTableName(): 'destinationAttraction' {
    return 'destinationAttraction';
  }

  protected getJoinTableIdField(): string {
    return 'attractionId';
  }

  async findByDestination(destinationId: string) {
    const rows = await super.findByDestination(destinationId);
    return rows.map((r: Record<string, unknown>) => ({ ...r, destinationId }));
  }

  async findPinsByDestination(destinationId: string) {
    return this.prisma.attraction.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      select: { id: true, name: true, lat: true, lng: true, category: true, img: true },
    });
  }

  async create(input: CreateAttractionInput) {
    const { destinationId: _destinationId, content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.attraction.create({
      data: { ...data, content: (content ?? {}) as any },
    });
  }

  async update(id: string, input: UpdateAttractionInput) {
    const { content, ...data } = input;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.attraction.update({
      where: { id },
      data: content !== undefined ? { ...data, content: content as any } : data,
    });
  }
}
