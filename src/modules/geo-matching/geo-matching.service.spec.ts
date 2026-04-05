import { Test, TestingModule } from '@nestjs/testing';
import { GeoMatchingService } from './geo-matching.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockDestination = {
  id: 'barcelona',
  lat: 41.3851,
  lng: 2.1734,
  radiusKm: 25,
};

const attractionInside = { id: 'sagrada-familia', lat: 41.4036, lng: 2.1744 };
const attractionOutside = { id: 'far-away', lat: 52.5200, lng: 13.4050 }; // Berlin

const restaurantInside = { id: 'el-xampanyet', lat: 41.3846, lng: 2.1808 };
const hotelInside = { id: 'hotel-arts', lat: 41.3866, lng: 2.1967 };

describe('GeoMatchingService', () => {
  let service: GeoMatchingService;
  let prisma: {
    destination: { findMany: jest.Mock };
    attraction: { findMany: jest.Mock };
    restaurant: { findMany: jest.Mock };
    hotel: { findMany: jest.Mock };
    destinationAttraction: { deleteMany: jest.Mock; createMany: jest.Mock };
    destinationRestaurant: { deleteMany: jest.Mock; createMany: jest.Mock };
    destinationHotel: { deleteMany: jest.Mock; createMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      destination: { findMany: jest.fn() },
      attraction: { findMany: jest.fn() },
      restaurant: { findMany: jest.fn() },
      hotel: { findMany: jest.fn() },
      destinationAttraction: { deleteMany: jest.fn(), createMany: jest.fn() },
      destinationRestaurant: { deleteMany: jest.fn(), createMany: jest.fn() },
      destinationHotel: { deleteMany: jest.fn(), createMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoMatchingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GeoMatchingService>(GeoMatchingService);
  });

  describe('recomputeForDestination', () => {
    it('creates junction rows only for POIs within radius', async () => {
      prisma.destination.findMany.mockResolvedValue([mockDestination]);
      prisma.attraction.findMany.mockResolvedValue([attractionInside, attractionOutside]);
      prisma.restaurant.findMany.mockResolvedValue([restaurantInside]);
      prisma.hotel.findMany.mockResolvedValue([hotelInside]);

      prisma.destinationAttraction.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationAttraction.createMany.mockResolvedValue({ count: 1 });
      prisma.destinationRestaurant.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationRestaurant.createMany.mockResolvedValue({ count: 1 });
      prisma.destinationHotel.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationHotel.createMany.mockResolvedValue({ count: 1 });

      await service.recomputeForDestination('barcelona');

      // Only the in-range attraction should be linked
      expect(prisma.destinationAttraction.createMany).toHaveBeenCalledWith({
        data: [{ destinationId: 'barcelona', attractionId: 'sagrada-familia' }],
        skipDuplicates: true,
      });
      // Berlin attraction must not appear
      const attractionCall = prisma.destinationAttraction.createMany.mock.calls[0][0];
      const ids = attractionCall.data.map((r: { attractionId: string }) => r.attractionId);
      expect(ids).not.toContain('far-away');
    });

    it('skips recompute if destination has no coordinates', async () => {
      prisma.destination.findMany.mockResolvedValue([
        { id: 'no-coords', lat: null, lng: null, radiusKm: 25 },
      ]);

      await service.recomputeForDestination('no-coords');

      expect(prisma.destinationAttraction.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('recomputeAll', () => {
    it('calls recomputeForDestination for each destination', async () => {
      prisma.destination.findMany.mockResolvedValue([
        mockDestination,
        { id: 'lisbon', lat: 38.7169, lng: -9.1395, radiusKm: 20 },
      ]);
      prisma.attraction.findMany.mockResolvedValue([]);
      prisma.restaurant.findMany.mockResolvedValue([]);
      prisma.hotel.findMany.mockResolvedValue([]);
      prisma.destinationAttraction.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationAttraction.createMany.mockResolvedValue({ count: 0 });
      prisma.destinationRestaurant.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationRestaurant.createMany.mockResolvedValue({ count: 0 });
      prisma.destinationHotel.deleteMany.mockResolvedValue({ count: 0 });
      prisma.destinationHotel.createMany.mockResolvedValue({ count: 0 });

      await service.recomputeAll();

      expect(prisma.destinationAttraction.deleteMany).toHaveBeenCalledTimes(2);
    });
  });
});
