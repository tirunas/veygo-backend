import { DestinationsRepository } from './destinations.repository';

const mockFindMany = jest.fn();
const mockPrisma = {
  destination: { findMany: mockFindMany },
} as any;

describe('DestinationsRepository.search', () => {
  let repo: DestinationsRepository;

  beforeEach(() => {
    mockFindMany.mockReset();
    repo = new DestinationsRepository(mockPrisma);
  });

  it('calls findMany with no where clause when no params given', async () => {
    mockFindMany.mockResolvedValue([]);
    await repo.search(undefined, undefined);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
    });
  });

  it('adds name/country OR filter when q is provided', async () => {
    mockFindMany.mockResolvedValue([]);
    await repo.search('paris', undefined);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'paris', mode: 'insensitive' } },
          { country: { contains: 'paris', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  });

  it('adds styles hasSome filter when styles are provided', async () => {
    mockFindMany.mockResolvedValue([]);
    await repo.search(undefined, ['culture', 'food']);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        styles: { hasSome: ['culture', 'food'] },
      },
      orderBy: { name: 'asc' },
    });
  });

  it('combines q and styles filters', async () => {
    mockFindMany.mockResolvedValue([]);
    await repo.search('rome', ['culture']);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'rome', mode: 'insensitive' } },
          { country: { contains: 'rome', mode: 'insensitive' } },
        ],
        styles: { hasSome: ['culture'] },
      },
      orderBy: { name: 'asc' },
    });
  });
});
