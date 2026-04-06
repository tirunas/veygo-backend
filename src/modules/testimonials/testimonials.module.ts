import { Module } from '@nestjs/common';
import { TestimonialsRepository } from './testimonials.repository';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { AdminTestimonialsController } from './admin-testimonials.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [TestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsRepository, TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
