import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateExperienceInput,
  UpdateExperienceInput,
  Experience,
} from './experiences.types';

@Injectable()
export class ExperiencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(destinationId?: string): Promise<Experience[]> {
    const rows = await this.prisma.experience.findMany({
      where: destinationId ? { destinationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows as Experience[];
  }

  async findById(id: string): Promise<Experience | null> {
    const row = await this.prisma.experience.findUnique({
      where: { id },
    });
    return row as Experience | null;
  }

  async create(data: CreateExperienceInput): Promise<Experience> {
    const row = await this.prisma.experience.create({
      data: { ...data, content: data.content as unknown as Prisma.InputJsonValue },
    });
    return row as Experience;
  }

  async update(id: string, data: UpdateExperienceInput): Promise<Experience> {
    const row = await this.prisma.experience.update({
      where: { id },
      data: { ...data, content: data.content as unknown as Prisma.InputJsonValue },
    });
    return row as Experience;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.experience.delete({
      where: { id },
    });
  }
}
