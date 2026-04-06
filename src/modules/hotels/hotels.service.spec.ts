import { HotelsService } from './hotels.service';

const mockRepo = {
  findByDestination: jest.fn(),
  findPinsByDestination: jest.fn(),
  findLinkedDestinationIds: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};
const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};
const mockGeo = { recomputeForHotel: jest.fn() } as any;

describe('HotelsService', () => {
  let service: HotelsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HotelsService(mockRepo as any, mockGeo, mockCache as any);
  });

  it('returns cached hotels without hitting repo', async () => {
    const cached = [{ id: 'hotel1', name: 'Luxury Hotel', location: { lat: 41.3, lng: 2.1 } }];
    mockCache.get.mockResolvedValueOnce(cached);
    const result = await service.findByDestination('barcelona');
    expect(result).toEqual(cached);
    expect(mockRepo.findByDestination).not.toHaveBeenCalled();
  });

  it('fetches from repo on cache miss and maps location', async () => {
    const rows = [
      {
        id: 'hotel1',
        name: 'Luxury Hotel',
        lat: 41.3,
        lng: 2.1,
        tier: 'comfort',
        area: 'Eixample',
        pricePerNight: 200,
        rating: '4.5',
        img: 'hotel.jpg',
        source: 'booking',
        content: { highlights: ['pool', 'spa'] },
      },
    ];
    mockRepo.findByDestination.mockResolvedValueOnce(rows);
    const result = await service.findByDestination('barcelona');
    expect(result[0].location).toEqual({ lat: 41.3, lng: 2.1 });
    expect(result[0].highlights).toEqual(['pool', 'spa']);
  });

  it('invalidates destination cache on delete', async () => {
    mockRepo.findLinkedDestinationIds.mockResolvedValueOnce(['barcelona']);
    await service.delete('hotel1');
    expect(mockCache.del).toHaveBeenCalledWith(expect.stringContaining('barcelona'));
    expect(mockRepo.delete).toHaveBeenCalledWith('hotel1');
  });
});
