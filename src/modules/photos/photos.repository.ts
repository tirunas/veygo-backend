import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PhotoEntityType, UpdatePhotoInput } from './photos.types';

@Injectable()
export class PhotosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntity(entityType: PhotoEntityType, entityId: string) {
    return this.prisma.photo.findMany({
      where: { entityType, entityId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.photo.findUnique({ where: { id } });
  }

  async create(data: {
    id: string;
    url: string;
    filename: string;
    entityType: PhotoEntityType;
    entityId: string;
    sortOrder: number;
    alt?: string;
  }) {
    return this.prisma.photo.create({ data });
  }

  async update(id: string, input: UpdatePhotoInput) {
    return this.prisma.photo.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    return this.prisma.photo.delete({ where: { id } });
  }

  async setPrimary(entityType: PhotoEntityType, entityId: string, photoId: string) {
    await this.prisma.photo.updateMany({
      where: { entityType, entityId },
      data: { isPrimary: false },
    });
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });
  }

  async reorder(orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.photo.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  async countByEntity(entityType: PhotoEntityType, entityId: string) {
    return this.prisma.photo.count({ where: { entityType, entityId } });
  }
}
