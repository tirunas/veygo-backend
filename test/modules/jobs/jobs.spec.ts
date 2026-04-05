import { WeatherSyncJob } from '../../../src/modules/jobs/weather-sync.job';
import { PriceSyncJob } from '../../../src/modules/jobs/price-sync.job';
import { CacheWarmJob } from '../../../src/modules/jobs/cache-warm.job';
import { AuditCleanupJob } from '../../../src/modules/jobs/audit-cleanup.job';
import { DestinationsService } from '../../../src/modules/destinations/destinations.service';
import { PricingService } from '../../../src/modules/pricing/pricing.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

const mockDestinationSummaries = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    styles: ['romantic'],
    bestSeason: 'spring',
    imgUrl: '',
    heroImageUrl: '',
    currentWeather: '',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    styles: ['cultural'],
    bestSeason: 'autumn',
    imgUrl: '',
    heroImageUrl: '',
    currentWeather: '',
  },
];

describe('WeatherSyncJob', () => {
  let mockDestinationsService: jest.Mocked<DestinationsService>;

  beforeEach(() => {
    mockDestinationsService = {
      findAll: jest.fn().mockResolvedValue(mockDestinationSummaries),
      updateDestination: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<DestinationsService>;
  });

  it('syncs weather for all destinations', async () => {
    const job = new WeatherSyncJob(mockDestinationsService);
    await job.syncWeather();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDestinationsService.findAll).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDestinationsService.updateDestination).toHaveBeenCalledTimes(
      mockDestinationSummaries.length,
    );
  });
});

describe('PriceSyncJob', () => {
  let mockDestinationsService: jest.Mocked<DestinationsService>;
  let mockPricingService: jest.Mocked<PricingService>;

  beforeEach(() => {
    mockDestinationsService = {
      findAll: jest.fn().mockResolvedValue(mockDestinationSummaries),
    } as unknown as jest.Mocked<DestinationsService>;

    const _pricingMock = {
      getPricesBatch: jest.fn().mockResolvedValue({ prices: [] } as unknown),
    } as unknown as jest.Mocked<PricingService>;

    mockPricingService = _pricingMock;
  });

  it('warms prices for all destinations from VNO hub', async () => {
    const job = new PriceSyncJob(mockDestinationsService, mockPricingService);
    await job.warmPrices();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDestinationsService.findAll).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPricingService.getPricesBatch).toHaveBeenCalledWith(
      'VNO',
      expect.arrayContaining(['paris', 'tokyo']),
    );
  });
});

describe('CacheWarmJob', () => {
  let mockDestinationsService: jest.Mocked<DestinationsService>;

  beforeEach(() => {
    mockDestinationsService = {
      findAll: jest.fn().mockResolvedValue(mockDestinationSummaries),
    } as unknown as jest.Mocked<DestinationsService>;
  });

  it('warms all destination data on bootstrap', async () => {
    const job = new CacheWarmJob(mockDestinationsService);
    await job.onApplicationBootstrap();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDestinationsService.findAll).toHaveBeenCalled();
  });
});

describe('AuditCleanupJob', () => {
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
    } as unknown as jest.Mocked<PrismaService>;
  });

  it('deletes audit logs older than 90 days', async () => {
    const job = new AuditCleanupJob(mockPrisma);
    await job.cleanupAuditLogs();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: { lt: expect.any(Date) as unknown },
      },
    });
  });
});
