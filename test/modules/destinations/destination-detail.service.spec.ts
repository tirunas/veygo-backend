import { NotFoundException } from '@nestjs/common';
import { DestinationDetailService } from '../../../src/modules/destinations/destination-detail.service';
import { DestinationsRepository } from '../../../src/modules/destinations/destinations.repository';
import {
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
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

describe('DestinationDetailService', () => {
  let service: DestinationDetailService;
  let mockRepo: jest.Mocked<DestinationsRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let mockAttractionsService: any;
  let mockRestaurantsService: any;
  let mockHotelsService: any;

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

    mockAttractionsService = {
      findByDestination: jest.fn(),
      findPinsByDestination: jest.fn(),
    };
    mockRestaurantsService = {
      findByDestination: jest.fn(),
      findPinsByDestination: jest.fn(),
    };
    mockHotelsService = {
      findByDestination: jest.fn(),
      findPinsByDestination: jest.fn(),
    };

    service = new DestinationDetailService(
      mockRepo,
      mockAttractionsService,
      mockRestaurantsService,
      mockHotelsService,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
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
      expect(result.totalCount).toBe(1);
      expect(result.destinationId).toBe('dest-1');
      expect(result.attractions[0].name).toBe('Museum');
    });

    it('returns empty array when no attractions', async () => {
      mockAttractionsService.findByDestination.mockResolvedValue([]);

      const result = await service.findAttractions('dest-1');

      expect(result.attractions).toEqual([]);
      expect(result.totalCount).toBe(0);
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
      expect(result.destinationId).toBe('dest-1');
      expect(result.foodSpots[0].name).toBe('Cafe');
    });

    it('returns empty array when no restaurants', async () => {
      mockRestaurantsService.findByDestination.mockResolvedValue([]);

      const result = await service.findFoodSpots('dest-1');

      expect(result.foodSpots).toEqual([]);
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

  describe('getDetail', () => {
    it('returns combined destination detail with POI', async () => {
      const destination = {
        ...mockDestination,
        id: 'dest-1',
      };
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
      const foodSpots = [
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
      const hotels = [
        {
          id: 'hotel-1',
          name: 'Hotel A',
          location: { lat: 1, lng: 2 },
          tier: 'luxury',
          area: 'downtown',
          pricePerNight: 150,
          rating: 4.5,
          img: 'hotel.jpg',
          source: 'booking.com',
          highlights: [],
          amenities: [],
          walkTo: [],
          roomTypes: [],
        },
      ];

      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(destination);
      mockAttractionsService.findByDestination.mockResolvedValue(attractions);
      mockRestaurantsService.findByDestination.mockResolvedValue(foodSpots);
      mockHotelsService.findByDestination.mockResolvedValue(hotels);

      const result = await service.getDetail('dest-1');

      expect(result.destination.id).toBe('dest-1');
      expect(result.attractions).toHaveLength(1);
      expect(result.foodSpots).toHaveLength(1);
      expect(result.hotels).toHaveLength(1);
    });
  });
});
