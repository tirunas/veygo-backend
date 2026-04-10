import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotoAdminController } from './photo-admin.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PhotosController, PhotoAdminController],
  providers: [PhotosService, PhotosRepository],
  exports: [PhotosService],
})
export class PhotosModule {}
