import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DestinationRecord,
  CreateDestinationInput,
  UpdateDestinationInput,
} from './destinations.types';

@Injectable()
export class DestinationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DestinationRecord[]> {
    const records = await this.prisma.destination.findMany({
      orderBy: { name: 'asc' },
    });
    return records as unknown as DestinationRecord[];
  }

  async findById(id: string): Promise<DestinationRecord | null> {
    const record = await this.prisma.destination.findUnique({
      where: { id },
    });
    return record as unknown as DestinationRecord | null;
  }

  async create(input: CreateDestinationInput): Promise<DestinationRecord> {
    const record = await this.prisma.destination.create({
      data: input as unknown as Parameters<
        typeof this.prisma.destination.create
      >[0]['data'],
    });
    return record as unknown as DestinationRecord;
  }

  async update(
    id: string,
    input: UpdateDestinationInput,
  ): Promise<DestinationRecord> {
    const record = await this.prisma.destination.update({
      where: { id },
      data: input as unknown as Parameters<
        typeof this.prisma.destination.update
      >[0]['data'],
    });
    return record as unknown as DestinationRecord;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.destination.delete({ where: { id } });
  }

  async search(
    q: string | undefined,
    styles: string[] | undefined,
  ): Promise<DestinationRecord[]> {
    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (styles?.length) {
      where.styles = { hasSome: styles };
    }

    const records = await this.prisma.destination.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return records as unknown as DestinationRecord[];
  }
}
