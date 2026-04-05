import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mockPrisma = {
      executeRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      destination: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(null),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(CACHE_MANAGER)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        reset: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns 200', () =>
    request(app.getHttpServer() as unknown)
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        const data = body.data as Record<string, unknown>;
        expect(data.status).toBe('ok');
      }));

  it('GET /health/ready returns 200 with component statuses', () =>
    request(app.getHttpServer() as unknown)
      .get('/health/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        const data = body.data as Record<string, unknown>;
        expect(data).toHaveProperty('database');
        expect(data).toHaveProperty('redis');
        expect(data.database).toBe('ok');
        expect(data.redis).toBe('ok');
      }));
});
