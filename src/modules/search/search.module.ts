import { Module } from '@nestjs/common';
import { DestinationsModule } from '../destinations/destinations.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [DestinationsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
