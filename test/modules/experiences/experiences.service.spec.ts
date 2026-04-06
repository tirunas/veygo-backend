import { NotFoundException } from '@nestjs/common';
import { ExperiencesService } from '../../../src/modules/experiences/experiences.service';

const mockExperience = {
  id: 'bunkers-del-carmel-barselona',
  destinationId: 'barcelona',
  title: 'Bunkers del Carmel saulėlydis',
  subtitle: 'Geriausia Barselonos panorama su vietiniais',
  category: 'Vaizdai',
  heroImgUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
  price: 'Nemokamai',
  duration: '2–3 val.',
  tags: ['Romantika', 'Vakaras', 'Panorama'],
  content: {},
};

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('ExperiencesService', () => {
  let service: ExperiencesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    service = new ExperiencesService(mockRepo as any, mockCache as any);
  });

  it('returns cached list on cache hit', async () => {
    mockCache.get.mockResolvedValueOnce([mockExperience]);
    const result = await service.findAll();
    expect(result).toEqual([mockExperience]);
    expect(mockRepo.findAll).not.toHaveBeenCalled();
  });

  it('fetches and caches list on cache miss', async () => {
    mockRepo.findAll.mockResolvedValue([mockExperience]);
    const result = await service.findAll();
    expect(result).toEqual([mockExperience]);
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('filters by destinationId when provided', async () => {
    mockRepo.findAll.mockResolvedValue([mockExperience]);
    await service.findAll('barcelona');
    expect(mockRepo.findAll).toHaveBeenCalledWith('barcelona');
  });

  it('throws NotFoundException when experience not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('busts list cache on create', async () => {
    mockRepo.create.mockResolvedValue(mockExperience);
    await service.create(mockExperience as any);
    expect(mockCache.del).toHaveBeenCalledWith('experiences:list');
  });
});
