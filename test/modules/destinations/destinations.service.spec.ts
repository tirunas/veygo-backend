import { NotFoundException } from '@nestjs/common';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { DestinationsRepository } from '../../../src/modules/destinations/destinations.repository';
import {
  DEST_LIST_KEY,
  DEST_LIST_TTL,
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
  DEST_ATTRACTIONS_KEY,
  DEST_ATTRACTIONS_TTL,
  DEST_FOOD_KEY,
  DEST_FOOD_TTL,
  DEST_MAP_KEY,
  DEST_MAP_TTL,
} from '../../../src/cache/cache.constants';
import { DestinationRecord } from '../../../src/modules/destinations/destinations.types';

const mockDestination: DestinationRecord = {
  id: 'paris',
  name: 'Paris',
  country: 'France',
  styles: ['romantic', 'cultural'],
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
  attractions: [],
  foodSpots: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DestinationsService', () => {
  let service: DestinationsService;
  let mockRepo: jest.Mocked<DestinationsRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let mockGeoMatching: { recomputeForDestination: jest.Mock };
  let mockAttractionsService: any;
  let mockRestaurantsService: any;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DestinationsRepository>;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockGeoMatching = {
      recomputeForDestination: jest.fn(),
    };

    mockAttractionsService = {
      findByDestination: jest.fn(),
      findPinsByDestination: jest.fn(),
    };
    mockRestaurantsService = {
      findByDestination: jest.fn(),
      findPinsByDestination: jest.fn(),
    };

    service = new DestinationsService(
      mockRepo,
      mockGeoMatching as any,
      mockAttractionsService,
      mockRestaurantsService,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
  });

  describe('findAll', () => {
    it('returns cached list when cache hit', async () => {
      mockCache.get.mockResolvedValue([mockDestination]);
      const result = await service.findAll();
      expect(mockCache.get).toHaveBeenCalledWith(DEST_LIST_KEY);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockDestination]);
      const result = await service.findAll();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        DEST_LIST_KEY,
        expect.any(Array),
        DEST_LIST_TTL * 1000,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findByIdOrThrow', () => {
    it('returns cached destination on cache hit', async () => {
      mockCache.get.mockResolvedValue(mockDestination);
      const result = await service.findByIdOrThrow('paris');
      expect(mockCache.get).toHaveBeenCalledWith(DEST_CONTENT_KEY('paris'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(result.id).toBe('paris');
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(mockDestination);
      const result = await service.findByIdOrThrow('paris');
      expect(mockCache.set).toHaveBeenCalledWith(
        DEST_CONTENT_KEY('paris'),
        mockDestination,
        DEST_CONTENT_TTL * 1000,
      );
      expect(result.id).toBe('paris');
    });

    it('throws NotFoundException when not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrThrow('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDestination', () => {
    it('creates and busts list cache', async () => {
      mockRepo.create.mockResolvedValue(mockDestination);
      await service.createDestination({
        id: 'paris',
        name: 'Paris',
        country: 'France',
        styles: ['romantic'],
        bestSeason: 'spring',
        imgUrl: 'https://example.com/paris.jpg',
        heroImageUrl: 'https://example.com/paris-hero.jpg',
        content: { attractions: [], foodSpots: [] },
      });
      expect(mockCache.del).toHaveBeenCalledWith(DEST_LIST_KEY);
    });
  });

  describe('updateDestination', () => {
    it('updates and busts list and content caches', async () => {
      mockRepo.update.mockResolvedValue({
        ...mockDestination,
        name: 'Paris Updated',
      });
      await service.updateDestination('paris', { name: 'Paris Updated' });
      expect(mockCache.del).toHaveBeenCalledWith(DEST_LIST_KEY);
      expect(mockCache.del).toHaveBeenCalledWith(DEST_CONTENT_KEY('paris'));
    });
  });

  describe('deleteDestination', () => {
    it('deletes and busts list and content caches', async () => {
      mockRepo.delete.mockResolvedValue(undefined);
      await service.deleteDestination('paris');
      expect(mockCache.del).toHaveBeenCalledWith(DEST_LIST_KEY);
      expect(mockCache.del).toHaveBeenCalledWith(DEST_CONTENT_KEY('paris'));
    });
  });

  describe('toSummary', () => {
    it('strips content from destination record', () => {
      const summary = service.toSummary(mockDestination);
      expect(summary.id).toBe('paris');
      expect(summary.name).toBe('Paris');
      expect(
        (summary as unknown as { content: unknown }).content,
      ).toBeUndefined();
    });
  });

  describe('findAttractions', () => {
    it('returns attractions from service', async () => {
      const attractions = [
        {
          id: 'attr-1',
          name: 'Museum',
          lat: 1,
          lng: 2,
          description: 'Art museum',
          category: 'popular' as const,
          img: 'museum.jpg',
          destinationId: 'dest-1',
          priceAndDuration: '$10, 2h',
          location: { lat: 1, lng: 2 },
        },
      ];
      mockAttractionsService.findByDestination.mockResolvedValue(attractions);

      const result = await service.findAttractions('dest-1');

      expect(mockAttractionsService.findByDestination).toHaveBeenCalledWith('dest-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Museum',
        lat: 1,
        lng: 2,
        description: 'Art museum',
        category: 'popular',
      });
    });

    it('returns empty array when no attractions', async () => {
      mockAttractionsService.findByDestination.mockResolvedValue([]);

      const result = await service.findAttractions('dest-1');

      expect(result).toEqual([]);
    });
  });

  describe('findFoodSpots', () => {
    it('returns food spots from service', async () => {
      const restaurants = [
        {
          id: 'rest-1',
          name: 'Cafe',
          lat: 1,
          lng: 2,
          description: 'Good coffee',
          type: 'cafe',
          price: '$',
          location: { lat: 1, lng: 2 },
        },
      ];
      mockRestaurantsService.findByDestination.mockResolvedValue(restaurants);

      const result = await service.findFoodSpots('dest-1');

      expect(mockRestaurantsService.findByDestination).toHaveBeenCalledWith('dest-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Cafe',
        lat: 1,
        lng: 2,
        description: 'Good coffee',
        cuisine: 'cafe',
        priceRange: '$',
      });
    });

    it('returns empty array when no restaurants', async () => {
      mockRestaurantsService.findByDestination.mockResolvedValue([]);

      const result = await service.findFoodSpots('dest-1');

      expect(result).toEqual([]);
    });
  });

  describe('findMapData', () => {
    it('returns map data with attractions and restaurants', async () => {
      const destination = {
        ...mockDestination,
        id: 'dest-1',
        lat: 10,
        lng: 20,
      };
      const attractionPins = [
        {
          id: 'attr-1',
          name: 'Museum',
          location: { lat: 10.1, lng: 20.1 },
          category: 'popular',
          img: 'museum.jpg',
        },
      ];
      const restaurantPins = [
        {
          id: 'rest-1',
          name: 'Cafe',
          location: { lat: 10.2, lng: 20.2 },
          type: 'cafe',
          price: '$',
        },
      ];

      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(destination);
      mockAttractionsService.findPinsByDestination.mockResolvedValue(attractionPins);
      mockRestaurantsService.findPinsByDestination.mockResolvedValue(restaurantPins);

      const result = await service.findMapData('dest-1');

      expect(result).toBeDefined();
      expect(result?.centerLat).toBe(10);
      expect(result?.centerLng).toBe(20);
      expect(result?.zoom).toBe(12);
      expect(result?.attractions).toHaveLength(1);
      expect(result?.foodSpots).toHaveLength(1);
    });

    it('returns map data with empty arrays when no POI', async () => {
      const destination = {
        ...mockDestination,
        id: 'dest-1',
        lat: 10,
        lng: 20,
      };

      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(destination);
      mockAttractionsService.findPinsByDestination.mockResolvedValue([]);
      mockRestaurantsService.findPinsByDestination.mockResolvedValue([]);

      const result = await service.findMapData('dest-1');

      expect(result).toBeDefined();
      expect(result?.attractions).toEqual([]);
      expect(result?.foodSpots).toEqual([]);
    });

    it('throws NotFoundException when destination not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findMapData('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
