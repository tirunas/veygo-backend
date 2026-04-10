import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memStorage } from './photos.multer';
import { PhotosService } from './photos.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { ReorderPhotosInput, UpdatePhotoInput } from './photos.types';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get(':entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.photosService.findByEntity(entityType, entityId);
  }

  @Post(':entityType/:entityId')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { storage: memStorage }))
  upload(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('alt') alt?: string,
  ) {
    return this.photosService.upload(entityType, entityId, file, alt);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: UpdatePhotoInput) {
    return this.photosService.update(id, body);
  }

  @Post(':id/crop')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  crop(
    @Param('id') id: string,
    @Body() body: { x: number; y: number; width: number; height: number },
  ) {
    return this.photosService.crop(id, body);
  }

  @Patch(':id/primary')
  @Roles(Role.ADMIN)
  setPrimary(@Param('id') id: string) {
    return this.photosService.setPrimary(id);
  }

  @Post(':entityType/:entityId/reorder')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  reorder(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: ReorderPhotosInput,
  ) {
    return this.photosService.reorder(entityType, entityId, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.photosService.delete(id);
  }
}
