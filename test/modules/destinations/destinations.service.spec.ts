import { NotFoundException } from '@nestjs/common';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { DestinationsRepository } from '../../../src/modules/destinations/destinations.repository';
import {
  DEST_LIST_KEY,
  DEST_LIST_TTL,
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

describe('DestinationsService', () => {
  let service: DestinationsService;
  let mockRepo: jest.Mocked<DestinationsRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let mockGeoMatching: { recomputeForDestination: jest.Mock };

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

    service = new DestinationsService(
      mockRepo,
      mockGeoMatching as any,
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

});
