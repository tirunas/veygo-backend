import { PricingService } from '../../../src/modules/pricing/pricing.service';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { PRICE_KEY, PRICE_TTL } from '../../../src/cache/cache.constants';
import { DestinationRecord } from '../../../src/modules/destinations/destinations.types';

const mockDestination: DestinationRecord = {
  id: 'paris',
  name: 'Paris',
  country: 'France',
  styles: ['romantic'],
  bestSeason: 'spring',
  imgUrl: 'https://example.com/paris.jpg',
  heroImageUrl: 'https://example.com/paris-hero.jpg',
  currentWeather: '18°C',
  content: {
    attractions: [],
    foodSpots: [],
    startingPrice: 299,
    flightHours: 3,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PricingService', () => {
  let service: PricingService;
  let mockDestinationsService: jest.Mocked<DestinationsService>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    mockDestinationsService = {
      findByIdOrThrow: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<DestinationsService>;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    service = new PricingService(
      mockDestinationsService,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
  });

  describe('getPrice', () => {
    it('returns cached price on cache hit', async () => {
      const cachedPrice = {
        destinationId: 'paris',
        hubCode: 'VNO',
        startingPrice: 299,
        flightHours: 3,
        currency: 'EUR',
      };
      mockCache.get.mockResolvedValue(cachedPrice);

      const result = await service.getPrice('paris', 'VNO');
      expect(mockCache.get).toHaveBeenCalledWith(PRICE_KEY('paris', 'VNO'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDestinationsService.findByIdOrThrow).not.toHaveBeenCalled();
      expect(result.startingPrice).toBe(299);
    });

    it('fetches destination and caches price on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDestinationsService.findByIdOrThrow.mockResolvedValue(
        mockDestination,
      );

      const result = await service.getPrice('paris', 'VNO');
      expect(mockCache.set).toHaveBeenCalledWith(
        PRICE_KEY('paris', 'VNO'),
        expect.objectContaining({ destinationId: 'paris', hubCode: 'VNO' }),
        PRICE_TTL * 1000,
      );
      expect(result.startingPrice).toBe(299);
      expect(result.flightHours).toBe(3);
    });

    it('normalizes IATA code to hub', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDestinationsService.findByIdOrThrow.mockResolvedValue(
        mockDestination,
      );

      const result = await service.getPrice('paris', 'KUN');
      expect(result.hubCode).toBe('VNO');
    });
  });

  describe('getPricesBatch', () => {
    it('returns prices for multiple destinations', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDestinationsService.findByIdOrThrow.mockResolvedValue(
        mockDestination,
      );

      const result = await service.getPricesBatch('VNO', ['paris', 'london']);
      expect(result.prices).toHaveLength(2);
    });
  });

  describe('detectOrigin', () => {
    it('returns default hub VNO', () => {
      const result = service.detectOrigin();
      expect(result.hubCode).toBe('VNO');
    });
  });
});
