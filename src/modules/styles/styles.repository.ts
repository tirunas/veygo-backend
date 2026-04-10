import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StyleRecord } from './styles.types';

@Injectable()
export class StylesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<StyleRecord[]> {
    const records = await this.prisma.style.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return records as unknown as StyleRecord[];
  }
}
