import { NotFoundException } from '@nestjs/common';
import { ReadyPlansService } from '../../../src/modules/ready-plans/ready-plans.service';

const mockItinerary = {
  id: 'itin-1',
  title: 'Test Itinerary',
  days: [],
  costs: { flights: 100, hotel: 200, food: 50, transport: 20, activities: 30 },
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPlan = {
  id: 'plan-1',
  itineraryId: 'itin-1',
  title: 'Barcelona Summer',
  subtitle: '4 days',
  price: 999,
  imgUrl: 'https://example.com/img.jpg',
  badge: 'Popular',
  tags: ['Summer', 'Beach'],
  isPublished: true,
  destinations: [],
  totalDays: 4,
  itinerary: mockItinerary,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  setPublished: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('ReadyPlansService', () => {
  let service: ReadyPlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    service = new ReadyPlansService(mockRepo as any, mockCache as any);
  });

  it('returns cached list on cache hit', async () => {
    mockCache.get.mockResolvedValueOnce([mockPlan]);
    const result = await service.findAll();
    expect(result).toEqual([mockPlan]);
    expect(mockRepo.findAll).not.toHaveBeenCalled();
  });

  it('fetches and caches list on cache miss', async () => {
    mockRepo.findAll.mockResolvedValue([mockPlan]);
    const result = await service.findAll();
    expect(result).toEqual([mockPlan]);
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('returns cached plan on cache hit', async () => {
    mockCache.get.mockResolvedValueOnce(mockPlan);
    const result = await service.findById('plan-1');
    expect(result).toEqual(mockPlan);
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when plan not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('busts list and item cache on setPublished', async () => {
    mockRepo.setPublished.mockResolvedValue({ ...mockPlan, isPublished: false });
    await service.setPublished('plan-1', false);
    expect(mockCache.del).toHaveBeenCalledWith('ready-plans:list');
    expect(mockCache.del).toHaveBeenCalledWith('ready-plan:plan-1');
  });
});
