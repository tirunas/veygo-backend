import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DestinationsController } from '../../../src/modules/destinations/destinations.controller';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { DestinationDetailService } from '../../../src/modules/destinations/destination-detail.service';
import {
  DestinationSummary,
  DestinationRecord,
} from '../../../src/modules/destinations/destinations.types';

const mockSummary: DestinationSummary = {
  id: 'paris',
  name: 'Paris',
  country: 'France',
  styles: ['romantic'],
  bestSeason: 'spring',
  imgUrl: 'https://example.com/paris.jpg',
  heroImageUrl: 'https://example.com/paris-hero.jpg',
  currentWeather: '18°C',
};

const mockRecord: DestinationRecord = {
  ...mockSummary,
  content: { attractions: [], foodSpots: [] },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DestinationsController', () => {
  let controller: DestinationsController;
  let mockService: jest.Mocked<DestinationsService>;
  let mockDetailService: jest.Mocked<DestinationDetailService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn(),
      findByIdOrThrow: jest.fn(),
      createDestination: jest.fn(),
      updateDestination: jest.fn(),
      deleteDestination: jest.fn(),
      toSummary: jest.fn(),
    } as unknown as jest.Mocked<DestinationsService>;

    mockDetailService = {
      findAttractions: jest.fn(),
      findFoodSpots: jest.fn(),
      findMapData: jest.fn(),
      getDetail: jest.fn(),
    } as unknown as jest.Mocked<DestinationDetailService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestinationsController],
      providers: [
        { provide: DestinationsService, useValue: mockService },
        { provide: DestinationDetailService, useValue: mockDetailService },
      ],
    }).compile();

    controller = module.get<DestinationsController>(DestinationsController);
  });

  it('GET / returns list of summaries', async () => {
    mockService.findAll.mockResolvedValue([mockSummary]);
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('paris');
  });

  it('GET /:id returns destination record', async () => {
    mockService.findByIdOrThrow.mockResolvedValue(mockRecord);
    const result = await controller.findById('paris');
    expect(result.id).toBe('paris');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockService.findByIdOrThrow).toHaveBeenCalledWith('paris');
  });

  it('GET /:id throws NotFoundException when not found', async () => {
    mockService.findByIdOrThrow.mockRejectedValue(new NotFoundException());
    await expect(controller.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
