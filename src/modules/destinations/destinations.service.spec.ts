import { DestinationsService } from './destinations.service';
import type { DestinationRecord } from './destinations.types';

const mockSearch = jest.fn();
const mockCacheGet = jest.fn().mockResolvedValue(null);
const mockCacheSet = jest.fn().mockResolvedValue(undefined);

const mockRepo = { search: mockSearch } as any;
const mockCache = { get: mockCacheGet, set: mockCacheSet } as any;
const mockGeoMatching = { recomputeForDestination: jest.fn() } as any;
const mockAttractionsService = {} as any;
const mockRestaurantsService = {} as any;

const makeRecord = (overrides: Partial<DestinationRecord> = {}): DestinationRecord => ({
  id: 'barcelona',
  name: 'Barselona',
  country: 'Ispanija',
  styles: ['culture', 'food'],
  bestSeason: 'Balandis',
  imgUrl: 'img.jpg',
  heroImageUrl: 'hero.jpg',
  currentWeather: '22°C',
  content: {
    minDailyBudget: 60,
    flightHours: 3.5,
    startingPrice: 1230,
    attractions: [],
    foodSpots: [],
    weather: [{ month: 'Balandis', quality: 'best' }],
  } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DestinationsService.search', () => {
  let service: DestinationsService;

  beforeEach(() => {
    mockSearch.mockReset();
    service = new DestinationsService(mockRepo, mockGeoMatching, mockAttractionsService, mockRestaurantsService, mockCache);
  });

  it('returns all results when no filters provided', async () => {
    mockSearch.mockResolvedValue([makeRecord()]);
    const results = await service.search({});
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('barcelona');
  });

  it('maps content fields to flat search result', async () => {
    mockSearch.mockResolvedValue([makeRecord()]);
    const results = await service.search({});
    expect(results[0].minDailyBudget).toBe(60);
    expect(results[0].flightHours).toBe(3.5);
    expect(results[0].startingPrice).toBe(1230);
  });

  it('filters by maxBudget', async () => {
    mockSearch.mockResolvedValue([
      makeRecord({ id: 'cheap', content: { minDailyBudget: 40, flightHours: 2, startingPrice: 500, attractions: [], foodSpots: [], weather: [] } as any }),
      makeRecord({ id: 'expensive', content: { minDailyBudget: 120, flightHours: 2, startingPrice: 1500, attractions: [], foodSpots: [], weather: [] } as any }),
    ]);
    const results = await service.search({ maxBudget: 80 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cheap');
  });

  it('filters by maxFlightH', async () => {
    mockSearch.mockResolvedValue([
      makeRecord({ id: 'close', content: { flightHours: 2, minDailyBudget: 50, startingPrice: 600, attractions: [], foodSpots: [], weather: [] } as any }),
      makeRecord({ id: 'far', content: { flightHours: 10, minDailyBudget: 50, startingPrice: 600, attractions: [], foodSpots: [], weather: [] } as any }),
    ]);
    const results = await service.search({ maxFlightH: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('close');
  });

  it('filters by month — only destinations with that month as best', async () => {
    mockSearch.mockResolvedValue([
      makeRecord({ id: 'spring', content: { minDailyBudget: 50, flightHours: 2, startingPrice: 600, attractions: [], foodSpots: [], weather: [{ month: 'Balandis', quality: 'best' }] } as any }),
      makeRecord({ id: 'summer', content: { minDailyBudget: 50, flightHours: 2, startingPrice: 600, attractions: [], foodSpots: [], weather: [{ month: 'Liepa', quality: 'best' }] } as any }),
    ]);
    const results = await service.search({ months: 'Balandis' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('spring');
  });

  it('filters by weather warm (>=20°C)', async () => {
    mockSearch.mockResolvedValue([
      makeRecord({ id: 'warm', currentWeather: '25°C', content: { minDailyBudget: 50, flightHours: 2, startingPrice: 600, attractions: [], foodSpots: [], weather: [] } as any }),
      makeRecord({ id: 'cold', currentWeather: '10°C', content: { minDailyBudget: 50, flightHours: 2, startingPrice: 600, attractions: [], foodSpots: [], weather: [] } as any }),
    ]);
    const results = await service.search({ weather: 'warm' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('warm');
  });

  it('passes q and styles to repository', async () => {
    mockSearch.mockResolvedValue([]);
    await service.search({ q: 'paris', styles: 'culture,food' });
    expect(mockSearch).toHaveBeenCalledWith('paris', ['culture', 'food']);
  });
});
