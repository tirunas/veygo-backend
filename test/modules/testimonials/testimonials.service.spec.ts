import { NotFoundException } from '@nestjs/common';
import { TestimonialsService } from '../../../src/modules/testimonials/testimonials.service';

const mockTestimonial = {
  id: 'lina-barcelona',
  text: '"Barselona be turistų minios yra įmanoma! Mūsų Gaudí maršrutas prasidėjo 8:00 ryte."',
  author: 'Lina M.',
  city: 'Vilnius',
  initials: 'LM',
  colorHex: '#E8734A',
  destinationName: 'Barselona',
  tripDate: '2025 m. liepa',
  highlight: 'Sagrada Família be eilių',
  savedAmount: '~€80',
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

describe('TestimonialsService', () => {
  let service: TestimonialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    service = new TestimonialsService(mockRepo as any, mockCache as any);
  });

  it('returns cached list on cache hit', async () => {
    mockCache.get.mockResolvedValueOnce([mockTestimonial]);
    const result = await service.findAll();
    expect(result).toEqual([mockTestimonial]);
    expect(mockRepo.findAll).not.toHaveBeenCalled();
  });

  it('fetches and caches list on cache miss', async () => {
    mockRepo.findAll.mockResolvedValue([mockTestimonial]);
    const result = await service.findAll();
    expect(result).toEqual([mockTestimonial]);
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('throws NotFoundException when testimonial not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('busts cache on create', async () => {
    mockRepo.create.mockResolvedValue(mockTestimonial);
    await service.create(mockTestimonial as any);
    expect(mockCache.del).toHaveBeenCalledWith('testimonials:list');
  });

  it('busts cache on delete', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await service.delete('lina-barcelona');
    expect(mockCache.del).toHaveBeenCalledWith('testimonials:list');
  });
});
