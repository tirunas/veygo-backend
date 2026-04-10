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
      include: {
        styles: {
          include: { style: true },
          orderBy: { style: { sortOrder: 'asc' } },
        },
      },
    });
    return records.map((r) => {
      const styles = r.styles.map((ds) => ds.style);
      return { ...r, styles } as unknown as DestinationRecord;
    });
  }

  async findById(id: string): Promise<DestinationRecord | null> {
    const record = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        styles: {
          include: { style: true },
          orderBy: { style: { sortOrder: 'asc' } },
        },
      },
    });
    if (!record) return null;
    const styles = record.styles.map((ds) => ds.style);
    return { ...record, styles } as unknown as DestinationRecord;
  }

  async findPhotosById(id: string): Promise<string[]> {
    const row = await this.prisma.destination.findUnique({
      where: { id },
      select: { photos: true },
    });
    const raw = row?.photos;
    return Array.isArray(raw) ? (raw as string[]) : [];
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
      where.styles = { some: { style: { slug: { in: styles } } } };
    }

    const records = await this.prisma.destination.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        styles: {
          include: { style: true },
          orderBy: { style: { sortOrder: 'asc' } },
        },
      },
    });
    return records.map((r) => {
      const styles = r.styles.map((ds) => ds.style);
      return { ...r, styles } as unknown as DestinationRecord;
    });
  }
}
