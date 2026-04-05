import { Module } from '@nestjs/common';
import { GeoMatchingService } from './geo-matching.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GeoMatchingService],
  exports: [GeoMatchingService],
})
export class GeoMatchingModule {}
