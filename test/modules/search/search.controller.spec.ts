import { SearchController } from '../../../src/modules/search/search.controller';
import { SearchService } from '../../../src/modules/search/search.service';
import { DestinationSummary } from '../../../src/modules/destinations/destinations.types';

const mockDestinations: DestinationSummary[] = [
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
    styles: ['adventure', 'cultural'],
    bestSeason: 'autumn',
    imgUrl: 'https://example.com/tokyo.jpg',
    heroImageUrl: 'https://example.com/tokyo-hero.jpg',
    currentWeather: '22°C',
  },
];

describe('SearchController', () => {
  let controller: SearchController;
  let mockSearchService: jest.Mocked<Pick<SearchService, 'search'>>;

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn().mockResolvedValue(mockDestinations),
    };
    controller = new SearchController(
      mockSearchService as unknown as SearchService,
    );
  });

  it('calls search service with parsed query params', async () => {
    await controller.search('paris', undefined, undefined);
    expect(mockSearchService.search).toHaveBeenCalledWith({
      query: 'paris',
      styles: undefined,
      origin: undefined,
    });
  });

  it('parses comma-separated styles into array', async () => {
    await controller.search(undefined, 'beach, cultural', undefined);
    expect(mockSearchService.search).toHaveBeenCalledWith({
      query: undefined,
      styles: ['beach', 'cultural'],
      origin: undefined,
    });
  });

  it('trims whitespace from styles array', async () => {
    await controller.search(undefined, 'beach  ,  cultural  ', undefined);
    expect(mockSearchService.search).toHaveBeenCalledWith({
      query: undefined,
      styles: ['beach', 'cultural'],
      origin: undefined,
    });
  });

  it('passes origin parameter from query params to service', async () => {
    await controller.search('tokyo', 'cultural', 'London');
    expect(mockSearchService.search).toHaveBeenCalledWith({
      query: 'tokyo',
      styles: ['cultural'],
      origin: 'London',
    });
  });

  it('returns search results from service', async () => {
    const result = await controller.search(undefined, undefined, undefined);
    expect(result).toEqual(mockDestinations);
  });
});
