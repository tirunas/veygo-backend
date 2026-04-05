import { DestinationsRepository } from '../../../src/modules/destinations/destinations.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CreateDestinationInput } from '../../../src/modules/destinations/destinations.types';

describe('DestinationsRepository', () => {
  const mockPrisma = {
    destination: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  let repo: DestinationsRepository;

  beforeEach(() => {
    repo = new DestinationsRepository(mockPrisma);
    jest.clearAllMocks();
  });

  it('findAll calls prisma.destination.findMany with orderBy name', async () => {
    (mockPrisma.destination.findMany as jest.Mock).mockResolvedValue([]);
    const result = await repo.findAll();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.destination.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([]);
  });

  it('findById calls prisma.destination.findUnique with id', async () => {
    (mockPrisma.destination.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await repo.findById('dest-1');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.destination.findUnique).toHaveBeenCalledWith({
      where: { id: 'dest-1' },
    });
    expect(result).toBeNull();
  });

  it('create calls prisma.destination.create with data', async () => {
    const input: CreateDestinationInput = {
      id: 'paris',
      name: 'Paris',
      country: 'France',
      styles: ['romantic'],
      bestSeason: 'spring',
      imgUrl: 'https://example.com/paris.jpg',
      heroImageUrl: 'https://example.com/paris-hero.jpg',
      content: {},
    };
    const mockRecord = {
      ...input,
      currentWeather: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockPrisma.destination.create as jest.Mock).mockResolvedValue(mockRecord);
    const result = await repo.create(input);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.destination.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockRecord);
  });

  it('update calls prisma.destination.update with id and data', async () => {
    const mockRecord = { id: 'paris', name: 'Paris Updated' };
    (mockPrisma.destination.update as jest.Mock).mockResolvedValue(mockRecord);
    const result = await repo.update('paris', { name: 'Paris Updated' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.destination.update).toHaveBeenCalledWith({
      where: { id: 'paris' },
      data: { name: 'Paris Updated' },
    });
    expect(result).toEqual(mockRecord);
  });

  it('delete calls prisma.destination.delete with id', async () => {
    (mockPrisma.destination.delete as jest.Mock).mockResolvedValue(undefined);
    await repo.delete('paris');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.destination.delete).toHaveBeenCalledWith({
      where: { id: 'paris' },
    });
  });
});
