import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { PhotosRepository } from './photos.repository';
import type { Photo, PhotoEntityType, ReorderPhotosInput, UpdatePhotoInput } from './photos.types';
import { DEST_CONTENT_KEY } from '../../cache/cache.constants';

const VALID_ENTITY_TYPES: PhotoEntityType[] = ['Destination', 'Attraction', 'Restaurant', 'Hotel'];

/** Max width per entity type — height scales proportionally. No forced crop. */
const MAX_WIDTH: Record<PhotoEntityType, number> = {
  Destination: 1920,
  Attraction:  1200,
  Restaurant:  1200,
  Hotel:       1200,
};

const WEBP_QUALITY = 85;

@Injectable()
export class PhotosService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(
    private readonly repo: PhotosRepository,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
    const port = this.config.get<number>('PORT') ?? 3201;
    this.baseUrl = this.config.get<string>('BASE_URL') ?? `http://localhost:${port}`;
  }

  private async invalidateEntityCache(entityType: PhotoEntityType, entityId: string): Promise<void> {
    if (entityType === 'Destination') {
      await this.cacheManager.del(DEST_CONTENT_KEY(entityId));
    }
  }

  private validateEntityType(entityType: string): PhotoEntityType {
    if (!VALID_ENTITY_TYPES.includes(entityType as PhotoEntityType)) {
      throw new BadRequestException(
        `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
      );
    }
    return entityType as PhotoEntityType;
  }

  private toPhoto(record: {
    id: string;
    url: string;
    filename: string;
    entityType: string;
    entityId: string;
    isPrimary: boolean;
    sortOrder: number;
    alt: string | null;
    createdAt: Date;
  }): Photo {
    return record as Photo;
  }

  /**
   * Resize to max width (preserving aspect ratio) and compress to WebP 85%.
   * No forced crop — admin controls crop separately via /photos/:id/crop.
   */
  private async processImage(buffer: Buffer, entityType: PhotoEntityType): Promise<Buffer> {
    return sharp(buffer)
      .resize(MAX_WIDTH[entityType], undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  }

  /**
   * Apply a manual crop (x, y, width, height in pixels of the stored image),
   * then re-compress. Replaces the stored file in-place.
   */
  async crop(
    id: string,
    cropBox: { x: number; y: number; width: number; height: number },
  ): Promise<Photo> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Photo ${id} not found`);

    const filePath = path.join(this.uploadsDir, existing.filename);
    const original = fs.readFileSync(filePath);

    const cropped = await sharp(original)
      .extract({ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    fs.writeFileSync(filePath, cropped);
    return this.toPhoto(existing);
  }

  async upload(
    entityType: string,
    entityId: string,
    file: Express.Multer.File,
    alt?: string,
  ): Promise<Photo> {
    const type = this.validateEntityType(entityType);
    const id = uuidv4();
    const filename = `${id}.webp`;
    const filePath = path.join(this.uploadsDir, filename);

    const processed = await this.processImage(file.buffer, type);
    fs.writeFileSync(filePath, processed);

    const count = await this.repo.countByEntity(type, entityId);
    const url = `${this.baseUrl}/uploads/photos/${filename}`;

    const record = await this.repo.create({
      id,
      url,
      filename,
      entityType: type,
      entityId,
      sortOrder: count,
      alt,
    });

    await this.invalidateEntityCache(type, entityId);

    if (count === 0) {
      return this.toPhoto(await this.repo.setPrimary(type, entityId, id));
    }

    return this.toPhoto(record);
  }

  async findByEntity(entityType: string, entityId: string): Promise<Photo[]> {
    const type = this.validateEntityType(entityType);
    const records = await this.repo.findByEntity(type, entityId);
    return records.map((r) => this.toPhoto(r));
  }

  async update(id: string, input: UpdatePhotoInput): Promise<Photo> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Photo ${id} not found`);
    const record = await this.repo.update(id, input);
    return this.toPhoto(record);
  }

  async setPrimary(id: string): Promise<Photo> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Photo ${id} not found`);
    const record = await this.repo.setPrimary(
      existing.entityType as PhotoEntityType,
      existing.entityId,
      id,
    );
    await this.invalidateEntityCache(existing.entityType as PhotoEntityType, existing.entityId);
    return this.toPhoto(record);
  }

  async reorder(entityType: string, entityId: string, input: ReorderPhotosInput): Promise<Photo[]> {
    const type = this.validateEntityType(entityType);
    await this.repo.reorder(input.orderedIds);
    const records = await this.repo.findByEntity(type, entityId);
    await this.invalidateEntityCache(type, entityId);
    return records.map((r) => this.toPhoto(r));
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Photo ${id} not found`);

    const filePath = path.join(this.uploadsDir, existing.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.repo.delete(id);
    await this.invalidateEntityCache(existing.entityType as PhotoEntityType, existing.entityId);

    if (existing.isPrimary) {
      const remaining = await this.repo.findByEntity(
        existing.entityType as PhotoEntityType,
        existing.entityId,
      );
      if (remaining.length > 0) {
        await this.repo.setPrimary(
          existing.entityType as PhotoEntityType,
          existing.entityId,
          remaining[0].id,
        );
      }
    }
  }
}
