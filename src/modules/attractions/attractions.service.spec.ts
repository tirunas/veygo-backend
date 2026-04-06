import { AttractionsService } from './attractions.service';

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
const mockGeo = { recomputeForAttraction: jest.fn() } as any;

describe('AttractionsService', () => {
  let service: AttractionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttractionsService(mockRepo as any, mockGeo, mockCache as any);
  });

  it('returns cached attractions without hitting repo', async () => {
    const cached = [{ id: 'sagrada', name: 'Sagrada Família' }];
    mockCache.get.mockResolvedValueOnce(cached);
    const result = await service.findByDestination('barcelona');
    expect(result).toEqual(cached);
    expect(mockRepo.findByDestination).not.toHaveBeenCalled();
  });

  it('fetches from repo on cache miss and writes cache', async () => {
    const rows = [{ id: 'sagrada', name: 'Sagrada Família', lat: 41.4, lng: 2.1, category: 'popular', img: '', content: {} }];
    mockRepo.findByDestination.mockResolvedValueOnce(rows);
    const result = await service.findByDestination('barcelona');
    expect(mockRepo.findByDestination).toHaveBeenCalledWith('barcelona');
    expect(mockCache.set).toHaveBeenCalled();
    expect(result[0].location).toEqual({ lat: 41.4, lng: 2.1 });
  });

  it('invalidates destination cache on delete', async () => {
    mockRepo.findLinkedDestinationIds.mockResolvedValueOnce(['barcelona']);
    await service.delete('sagrada');
    expect(mockRepo.findLinkedDestinationIds).toHaveBeenCalledWith('sagrada');
    expect(mockCache.del).toHaveBeenCalledWith(expect.stringContaining('barcelona'));
    expect(mockRepo.delete).toHaveBeenCalledWith('sagrada');
  });
});
