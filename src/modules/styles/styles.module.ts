import { Module } from '@nestjs/common';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';
import { StylesRepository } from './styles.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StylesController],
  providers: [StylesService, StylesRepository],
  exports: [StylesService],
})
export class StylesModule {}
