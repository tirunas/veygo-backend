import { Injectable } from '@nestjs/common';
import { DestinationsService } from '../destinations/destinations.service';
import { DestinationSummary } from '../destinations/destinations.types';
import { SearchQuery } from './search.types';

@Injectable()
export class SearchService {
  constructor(private readonly destinationsService: DestinationsService) {}

  async search(query: SearchQuery): Promise<DestinationSummary[]> {
    const all = await this.destinationsService.findAll();
    return all.filter((destination) => this.matchesQuery(destination, query));
  }

  private matchesQuery(
    destination: DestinationSummary,
    query: SearchQuery,
  ): boolean {
    if (query.query) {
      const lowerQuery = query.query.toLowerCase();
      const matchesText =
        destination.name.toLowerCase().includes(lowerQuery) ||
        destination.country.toLowerCase().includes(lowerQuery);
      if (!matchesText) return false;
    }

    if (query.styles && query.styles.length > 0) {
      const hasMatchingStyle = query.styles.some((style) =>
        destination.styles.some((s) => s.slug === style),
      );
      if (!hasMatchingStyle) return false;
    }

    return true;
  }
}
