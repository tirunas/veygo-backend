import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get(PrismaService);
  });

  it('is instantiable and provides PrismaClient models', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PrismaService);
  });
});
