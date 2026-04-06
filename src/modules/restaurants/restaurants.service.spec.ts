import { RestaurantsService } from './restaurants.service';

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
const mockGeo = { recomputeForRestaurant: jest.fn() } as any;

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RestaurantsService(mockRepo as any, mockGeo, mockCache as any);
  });

  it('returns cached restaurants without hitting repo', async () => {
    const cached = [{ id: 'tapas', name: 'El Quim' }];
    mockCache.get.mockResolvedValueOnce(cached);
    const result = await service.findByDestination('barcelona');
    expect(result).toEqual(cached);
    expect(mockRepo.findByDestination).not.toHaveBeenCalled();
  });

  it('fetches from repo on cache miss and maps location', async () => {
    const rows = [{ id: 'tapas', name: 'El Quim', lat: 41.3, lng: 2.1, type: 'tapas', price: '€€', img: null, content: {} }];
    mockRepo.findByDestination.mockResolvedValueOnce(rows);
    const result = await service.findByDestination('barcelona');
    expect(result[0].location).toEqual({ lat: 41.3, lng: 2.1 });
  });

  it('invalidates destination cache on delete', async () => {
    mockRepo.findLinkedDestinationIds.mockResolvedValueOnce(['barcelona']);
    await service.delete('tapas');
    expect(mockCache.del).toHaveBeenCalledWith(expect.stringContaining('barcelona'));
    expect(mockRepo.delete).toHaveBeenCalledWith('tapas');
  });
});
