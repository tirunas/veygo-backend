import { SearchService } from '../../../src/modules/search/search.service';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { DestinationSummary } from '../../../src/modules/destinations/destinations.types';

const mockSummaries: DestinationSummary[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    styles: ['romantic', 'cultural'],
    bestSeason: 'spring',
    imgUrl: 'https://example.com/paris.jpg',
    heroImageUrl: 'https://example.com/paris-hero.jpg',
    currentWeather: '18°C',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    styles: ['adventure', 'cultural', 'food'],
    bestSeason: 'autumn',
    imgUrl: 'https://example.com/tokyo.jpg',
    heroImageUrl: 'https://example.com/tokyo-hero.jpg',
    currentWeather: '22°C',
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    styles: ['beach', 'cultural', 'food'],
    bestSeason: 'summer',
    imgUrl: 'https://example.com/barcelona.jpg',
    heroImageUrl: 'https://example.com/barcelona-hero.jpg',
    currentWeather: '25°C',
  },
];

describe('SearchService', () => {
  let service: SearchService;
  let mockDestinationsService: jest.Mocked<
    Pick<DestinationsService, 'findAll'>
  >;

  beforeEach(() => {
    mockDestinationsService = {
      findAll: jest.fn().mockResolvedValue(mockSummaries),
    };
    service = new SearchService(
      mockDestinationsService as unknown as DestinationsService,
    );
  });

  it('returns all destinations when no filters provided', async () => {
    const result = await service.search({});
    expect(result).toHaveLength(3);
  });

  it('filters by text query on name (case-insensitive)', async () => {
    const result = await service.search({ query: 'par' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('paris');
  });

  it('filters by text query on country (case-insensitive)', async () => {
    const result = await service.search({ query: 'jap' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tokyo');
  });

  it('filters by single style', async () => {
    const result = await service.search({ styles: ['beach'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('barcelona');
  });

  it('filters by multiple styles with OR logic', async () => {
    const result = await service.search({ styles: ['romantic', 'adventure'] });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain('paris');
    expect(result.map((r) => r.id)).toContain('tokyo');
  });

  it('combines text and style filters (AND logic between filters)', async () => {
    const result = await service.search({ query: 'a', styles: ['food'] });
    // 'a' matches Paris (pAris), Japan (jApAn), Barcelona (bArcелonA) — all 3 destinations have 'a'
    // Then filter by food style: only Tokyo and Barcelona have food
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain('tokyo');
    expect(result.map((r) => r.id)).toContain('barcelona');
  });

  it('returns empty array when no matches', async () => {
    const result = await service.search({ query: 'zzznomatch' });
    expect(result).toHaveLength(0);
  });

  it('accepts origin parameter (pass-through, not used for filtering)', async () => {
    // origin is passed through SearchQuery but does not affect filtering results.
    // Filtering by origin is handled by the PricingModule.
    const result = await service.search({ origin: 'London' });
    expect(result).toHaveLength(3);
  });

  it('origin parameter is pass-through with other filters (does not affect filtering)', async () => {
    // origin is included in SearchQuery but filtering is only by query and styles.
    // The PricingModule uses origin to calculate pricing, not to filter destinations.
    const result = await service.search({
      query: 'tokyo',
      styles: ['cultural'],
      origin: 'Singapore',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tokyo');
  });
});
