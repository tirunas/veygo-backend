# Live Data — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Itinerary, ReadyPlan, Experience, and Testimonial Prisma models with full NestJS modules (cache-aside, public + admin controllers) and seed data.

**Architecture:** Each module follows the established POI pattern: Repository → Service (cache-aside with CACHE_MANAGER) → Public Controller (`@Public()`) + Admin Controller (`@Roles(Role.ADMIN) @UseGuards(RolesGuard)`) → Module. The existing `PlansModule` at `src/modules/plans/` is NOT touched — it handles the existing `UserPlan` model.

**Tech Stack:** NestJS, Prisma (PostgreSQL), `@nestjs/cache-manager`, TypeScript strict

---

## File Map

**New files:**
- `prisma/schema.prisma` — add 6 new models
- `src/cache/cache.constants.ts` — 4 new cache key groups
- `src/modules/itineraries/itineraries.types.ts`
- `src/modules/itineraries/itineraries.repository.ts`
- `src/modules/itineraries/itineraries.service.ts`
- `src/modules/itineraries/itineraries.controller.ts`
- `src/modules/itineraries/admin-itineraries.controller.ts`
- `src/modules/itineraries/itineraries.module.ts`
- `src/modules/ready-plans/ready-plans.types.ts`
- `src/modules/ready-plans/ready-plans.repository.ts`
- `src/modules/ready-plans/ready-plans.service.ts`
- `src/modules/ready-plans/ready-plans.controller.ts`
- `src/modules/ready-plans/admin-ready-plans.controller.ts`
- `src/modules/ready-plans/ready-plans.module.ts`
- `src/modules/experiences/experiences.types.ts`
- `src/modules/experiences/experiences.repository.ts`
- `src/modules/experiences/experiences.service.ts`
- `src/modules/experiences/experiences.controller.ts`
- `src/modules/experiences/admin-experiences.controller.ts`
- `src/modules/experiences/experiences.module.ts`
- `src/modules/testimonials/testimonials.types.ts`
- `src/modules/testimonials/testimonials.repository.ts`
- `src/modules/testimonials/testimonials.service.ts`
- `src/modules/testimonials/testimonials.controller.ts`
- `src/modules/testimonials/admin-testimonials.controller.ts`
- `src/modules/testimonials/testimonials.module.ts`
- `test/modules/ready-plans/ready-plans.service.spec.ts`
- `test/modules/experiences/experiences.service.spec.ts`
- `test/modules/testimonials/testimonials.service.spec.ts`

**Modified files:**
- `src/app.module.ts` — add 4 new module imports
- `prisma/seed.ts` — add seed data for all new models

---

### Task 1: Prisma schema — add new models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add 6 new models to schema.prisma**

Append after the last `@@index` line (after `DestinationHotel` model):

```prisma
model Itinerary {
  id        String   @id @default(cuid())
  title     String?
  days      Json
  costs     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  segments  ItinerarySegment[]
  readyPlan ReadyPlan?
}

model ItinerarySegment {
  id            String @id @default(cuid())
  itineraryId   String
  destinationId String
  order         Int
  days          Json
  costs         Json

  itinerary   Itinerary   @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  destination Destination @relation(fields: [destinationId], references: [id])

  @@index([itineraryId])
  @@index([destinationId])
}

model ReadyPlan {
  id          String   @id
  itineraryId String   @unique
  title       String
  subtitle    String
  price       Int
  imgUrl      String
  badge       String?
  tags        String[]
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  itinerary Itinerary          @relation(fields: [itineraryId], references: [id])
  purchases ReadyPlanPurchase[]

  @@index([isPublished])
}

model ReadyPlanPurchase {
  id          String   @id @default(cuid())
  userId      String
  readyPlanId String
  amount      Int
  purchasedAt DateTime @default(now())

  readyPlan ReadyPlan @relation(fields: [readyPlanId], references: [id])

  @@index([userId])
  @@index([readyPlanId])
}

model Experience {
  id            String   @id
  destinationId String?
  title         String
  subtitle      String
  category      String
  heroImgUrl    String
  price         String
  duration      String
  tags          String[]
  content       Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([destinationId])
  @@index([category])
}

model Testimonial {
  id              String   @id
  text            String
  author          String
  city            String
  initials        String
  colorHex        String
  destinationName String?
  tripDate        String?
  highlight       String?
  savedAmount     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Also add `ItinerarySegment[]` relation to `Destination` model (inside the Destination model block, after `destinationHotels`):

```prisma
  itinerarySegments ItinerarySegment[]
```

- [ ] **Step 2: Run migration**

```bash
cd veygo-backend
npx prisma migrate dev --name add_itinerary_ready_plan_experience_testimonial
```

Expected: Migration created and applied, `prisma generate` runs automatically.

- [ ] **Step 3: Verify generated client**

```bash
npx prisma studio
```

Confirm tables `Itinerary`, `ItinerarySegment`, `ReadyPlan`, `ReadyPlanPurchase`, `Experience`, `Testimonial` appear. Then close studio (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Itinerary, ReadyPlan, Experience, Testimonial schema"
```

---

### Task 2: Cache constants

**Files:**
- Modify: `src/cache/cache.constants.ts`

- [ ] **Step 1: Append new constants**

Add to the end of `src/cache/cache.constants.ts`:

```typescript
export const ITINERARY_KEY = (id: string): string => `itinerary:${id}`;
export const ITINERARY_TTL = 3600; // 1 hour

export const READY_PLANS_LIST_KEY = 'ready-plans:list';
export const READY_PLAN_KEY = (id: string): string => `ready-plan:${id}`;
export const READY_PLAN_TTL = 3600; // 1 hour

export const EXPERIENCES_LIST_KEY = 'experiences:list';
export const EXPERIENCE_KEY = (id: string): string => `experience:${id}`;
export const EXPERIENCE_TTL = 604800; // 7 days

export const TESTIMONIALS_LIST_KEY = 'testimonials:list';
export const TESTIMONIALS_TTL = 86400; // 24 hours
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/cache/cache.constants.ts
git commit -m "feat: add cache constants for itinerary, ready-plan, experience, testimonial"
```

---

### Task 3: Itineraries module

**Files:**
- Create: `src/modules/itineraries/itineraries.types.ts`
- Create: `src/modules/itineraries/itineraries.repository.ts`
- Create: `src/modules/itineraries/itineraries.service.ts`
- Create: `src/modules/itineraries/itineraries.controller.ts`
- Create: `src/modules/itineraries/admin-itineraries.controller.ts`
- Create: `src/modules/itineraries/itineraries.module.ts`

- [ ] **Step 1: Create types file**

`src/modules/itineraries/itineraries.types.ts`:

```typescript
export interface ItinerarySegment {
  id: string;
  itineraryId: string;
  destinationId: string;
  order: number;
  days: unknown[];
  costs: ItineraryCosts;
}

export interface ItineraryCosts {
  flights: number;
  hotel: number;
  food: number;
  transport: number;
  activities: number;
}

export interface Itinerary {
  id: string;
  title: string | null;
  days: unknown[];
  costs: ItineraryCosts;
  segments: ItinerarySegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItineraryInput {
  title?: string;
  days?: unknown[];
  costs?: ItineraryCosts;
}

export interface UpdateItineraryInput {
  title?: string;
  days?: unknown[];
  costs?: ItineraryCosts;
}

export interface CreateSegmentInput {
  destinationId: string;
  order: number;
  days: unknown[];
  costs: ItineraryCosts;
}
```

- [ ] **Step 2: Create repository**

`src/modules/itineraries/itineraries.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateItineraryInput,
  UpdateItineraryInput,
  CreateSegmentInput,
} from './itineraries.types';

@Injectable()
export class ItinerariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        segments: { orderBy: { order: 'asc' } },
      },
    });
  }

  async create(input: CreateItineraryInput) {
    return this.prisma.itinerary.create({
      data: {
        title: input.title,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        days: (input.days ?? []) as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        costs: (input.costs ?? { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 }) as any,
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, input: UpdateItineraryInput) {
    return this.prisma.itinerary.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(input.days !== undefined && { days: input.days as any }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(input.costs !== undefined && { costs: input.costs as any }),
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.itinerary.delete({ where: { id } });
  }

  async addSegment(itineraryId: string, input: CreateSegmentInput) {
    return this.prisma.itinerarySegment.create({
      data: {
        itineraryId,
        destinationId: input.destinationId,
        order: input.order,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        days: (input.days ?? []) as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        costs: input.costs as any,
      },
    });
  }

  async deleteSegment(segmentId: string): Promise<void> {
    await this.prisma.itinerarySegment.delete({ where: { id: segmentId } });
  }
}
```

- [ ] **Step 3: Create service**

`src/modules/itineraries/itineraries.service.ts`:

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ItinerariesRepository } from './itineraries.repository';
import { ITINERARY_KEY, ITINERARY_TTL } from '../../cache/cache.constants';
import type {
  Itinerary,
  ItineraryCosts,
  CreateItineraryInput,
  UpdateItineraryInput,
  CreateSegmentInput,
} from './itineraries.types';

@Injectable()
export class ItinerariesService {
  constructor(
    private readonly repo: ItinerariesRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findByIdOrThrow(id: string): Promise<Itinerary> {
    const cached = await this.cacheManager.get<Itinerary>(ITINERARY_KEY(id));
    if (cached) return cached;

    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException('Itinerary not found');
    const itinerary = this.toItinerary(record);
    await this.cacheManager.set(ITINERARY_KEY(id), itinerary, ITINERARY_TTL * 1000);
    return itinerary;
  }

  async create(input: CreateItineraryInput): Promise<Itinerary> {
    const record = await this.repo.create(input);
    return this.toItinerary(record);
  }

  async update(id: string, input: UpdateItineraryInput): Promise<Itinerary> {
    const record = await this.repo.update(id, input);
    await this.cacheManager.del(ITINERARY_KEY(id));
    return this.toItinerary(record);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.cacheManager.del(ITINERARY_KEY(id));
  }

  async addSegment(id: string, input: CreateSegmentInput): Promise<Itinerary> {
    await this.repo.addSegment(id, input);
    await this.cacheManager.del(ITINERARY_KEY(id));
    return this.findByIdOrThrow(id);
  }

  async deleteSegment(itineraryId: string, segmentId: string): Promise<void> {
    await this.repo.deleteSegment(segmentId);
    await this.cacheManager.del(ITINERARY_KEY(itineraryId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toItinerary(r: any): Itinerary {
    return {
      id: r.id as string,
      title: r.title as string | null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      days: (r.days as unknown[]) ?? [],
      costs: (r.costs as ItineraryCosts) ?? { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 },
      segments: (r.segments ?? []).map((s: any) => ({
        id: s.id as string,
        itineraryId: s.itineraryId as string,
        destinationId: s.destinationId as string,
        order: s.order as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        days: (s.days as unknown[]) ?? [],
        costs: (s.costs as ItineraryCosts) ?? { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 },
      })),
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }
}
```

- [ ] **Step 4: Create public controller**

`src/modules/itineraries/itineraries.controller.ts`:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ItinerariesService } from './itineraries.service';

@Public()
@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly service: ItinerariesService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findByIdOrThrow(id);
  }
}
```

- [ ] **Step 5: Create admin controller**

`src/modules/itineraries/admin-itineraries.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ItinerariesService } from './itineraries.service';
import type {
  CreateItineraryInput,
  UpdateItineraryInput,
  CreateSegmentInput,
} from './itineraries.types';

@Controller('admin/itineraries')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminItinerariesController {
  constructor(private readonly service: ItinerariesService) {}

  @Post()
  create(@Body() body: CreateItineraryInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateItineraryInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/segments')
  addSegment(@Param('id') id: string, @Body() body: CreateSegmentInput) {
    return this.service.addSegment(id, body);
  }

  @Delete(':id/segments/:segmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSegment(@Param('id') id: string, @Param('segmentId') segmentId: string) {
    return this.service.deleteSegment(id, segmentId);
  }
}
```

- [ ] **Step 6: Create module**

`src/modules/itineraries/itineraries.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ItinerariesRepository } from './itineraries.repository';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesController } from './itineraries.controller';
import { AdminItinerariesController } from './admin-itineraries.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ItinerariesController, AdminItinerariesController],
  providers: [ItinerariesRepository, ItinerariesService],
  exports: [ItinerariesService],
})
export class ItinerariesModule {}
```

- [ ] **Step 7: Check for TS errors**

```bash
cd veygo-backend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/modules/itineraries/
git commit -m "feat: add ItinerariesModule with cache-aside and admin CRUD"
```

---

### Task 4: Ready-plans module

**Files:**
- Create: `src/modules/ready-plans/ready-plans.types.ts`
- Create: `src/modules/ready-plans/ready-plans.repository.ts`
- Create: `src/modules/ready-plans/ready-plans.service.ts`
- Create: `src/modules/ready-plans/ready-plans.controller.ts`
- Create: `src/modules/ready-plans/admin-ready-plans.controller.ts`
- Create: `src/modules/ready-plans/ready-plans.module.ts`
- Create: `test/modules/ready-plans/ready-plans.service.spec.ts`

- [ ] **Step 1: Write failing tests**

`test/modules/ready-plans/ready-plans.service.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { ReadyPlansService } from '../../../src/modules/ready-plans/ready-plans.service';
import { ReadyPlansRepository } from '../../../src/modules/ready-plans/ready-plans.repository';
import {
  READY_PLANS_LIST_KEY,
  READY_PLAN_KEY,
  READY_PLAN_TTL,
} from '../../../src/cache/cache.constants';

const mockItinerary = {
  id: 'itin-1',
  title: null,
  days: [],
  costs: { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 },
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReadyPlan = {
  id: 'paris-5d',
  itineraryId: 'itin-1',
  title: 'Paryžius 5 dienoms',
  subtitle: 'Romantiškas Paryžius',
  price: 1290,
  imgUrl: 'https://example.com/paris.jpg',
  badge: 'Populiarus',
  tags: ['romantic'],
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  itinerary: mockItinerary,
};

describe('ReadyPlansService', () => {
  let service: ReadyPlansService;
  let mockRepo: jest.Mocked<ReadyPlansRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setPublished: jest.fn(),
    } as unknown as jest.Mocked<ReadyPlansRepository>;

    mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    service = new ReadyPlansService(
      mockRepo,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
  });

  describe('findAll', () => {
    it('returns cached list on cache hit', async () => {
      mockCache.get.mockResolvedValue([mockReadyPlan]);
      const result = await service.findAll();
      expect(mockCache.get).toHaveBeenCalledWith(READY_PLANS_LIST_KEY);
      expect(mockRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockReadyPlan]);
      const result = await service.findAll();
      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        READY_PLANS_LIST_KEY,
        expect.any(Array),
        READY_PLAN_TTL * 1000,
      );
      expect(result).toHaveLength(1);
    });

    it('returns only published plans', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockReadyPlan]);
      const result = await service.findAll();
      expect(result[0].id).toBe('paris-5d');
    });
  });

  describe('findByIdOrThrow', () => {
    it('returns cached plan on cache hit', async () => {
      mockCache.get.mockResolvedValue(mockReadyPlan);
      const result = await service.findByIdOrThrow('paris-5d');
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(result.id).toBe('paris-5d');
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(mockReadyPlan);
      const result = await service.findByIdOrThrow('paris-5d');
      expect(mockCache.set).toHaveBeenCalledWith(
        READY_PLAN_KEY('paris-5d'),
        expect.anything(),
        READY_PLAN_TTL * 1000,
      );
      expect(result.id).toBe('paris-5d');
    });

    it('throws NotFoundException when not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPublished', () => {
    it('busts list and item cache after publish toggle', async () => {
      mockRepo.setPublished.mockResolvedValue({ ...mockReadyPlan, isPublished: false });
      await service.setPublished('paris-5d', false);
      expect(mockCache.del).toHaveBeenCalledWith(READY_PLANS_LIST_KEY);
      expect(mockCache.del).toHaveBeenCalledWith(READY_PLAN_KEY('paris-5d'));
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd veygo-backend && npx jest test/modules/ready-plans/ready-plans.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../../src/modules/ready-plans/ready-plans.service'`

- [ ] **Step 3: Create types**

`src/modules/ready-plans/ready-plans.types.ts`:

```typescript
import type { Itinerary } from '../itineraries/itineraries.types';

export interface ReadyPlanSummary {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  imgUrl: string;
  badge: string | null;
  tags: string[];
  isPublished: boolean;
  destinations: string[];
  totalDays: number;
}

export interface ReadyPlan extends ReadyPlanSummary {
  itinerary: Itinerary;
}

export interface CreateReadyPlanInput {
  id: string;
  itineraryId: string;
  title: string;
  subtitle: string;
  price: number;
  imgUrl: string;
  badge?: string;
  tags?: string[];
}

export interface UpdateReadyPlanInput {
  title?: string;
  subtitle?: string;
  price?: number;
  imgUrl?: string;
  badge?: string;
  tags?: string[];
}
```

- [ ] **Step 4: Create repository**

`src/modules/ready-plans/ready-plans.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReadyPlanInput, UpdateReadyPlanInput } from './ready-plans.types';

const includeItinerary = {
  itinerary: {
    include: { segments: { orderBy: { order: 'asc' as const } } },
  },
};

@Injectable()
export class ReadyPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.readyPlan.findMany({
      where: { isPublished: true },
      include: includeItinerary,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.readyPlan.findUnique({
      where: { id },
      include: includeItinerary,
    });
  }

  async create(input: CreateReadyPlanInput) {
    return this.prisma.readyPlan.create({
      data: {
        id: input.id,
        itineraryId: input.itineraryId,
        title: input.title,
        subtitle: input.subtitle,
        price: input.price,
        imgUrl: input.imgUrl,
        badge: input.badge,
        tags: input.tags ?? [],
      },
      include: includeItinerary,
    });
  }

  async update(id: string, input: UpdateReadyPlanInput) {
    return this.prisma.readyPlan.update({
      where: { id },
      data: input,
      include: includeItinerary,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.readyPlan.delete({ where: { id } });
  }

  async setPublished(id: string, isPublished: boolean) {
    return this.prisma.readyPlan.update({
      where: { id },
      data: { isPublished },
      include: includeItinerary,
    });
  }
}
```

- [ ] **Step 5: Create service**

`src/modules/ready-plans/ready-plans.service.ts`:

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ReadyPlansRepository } from './ready-plans.repository';
import {
  READY_PLANS_LIST_KEY,
  READY_PLAN_KEY,
  READY_PLAN_TTL,
} from '../../cache/cache.constants';
import type {
  ReadyPlan,
  ReadyPlanSummary,
  CreateReadyPlanInput,
  UpdateReadyPlanInput,
} from './ready-plans.types';
import type { ItineraryCosts } from '../itineraries/itineraries.types';

@Injectable()
export class ReadyPlansService {
  constructor(
    private readonly repo: ReadyPlansRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<ReadyPlanSummary[]> {
    const cached = await this.cacheManager.get<ReadyPlanSummary[]>(READY_PLANS_LIST_KEY);
    if (cached) return cached;

    const records = await this.repo.findAll();
    const summaries = records.map((r) => this.toSummary(r));
    await this.cacheManager.set(READY_PLANS_LIST_KEY, summaries, READY_PLAN_TTL * 1000);
    return summaries;
  }

  async findByIdOrThrow(id: string): Promise<ReadyPlan> {
    const cached = await this.cacheManager.get<ReadyPlan>(READY_PLAN_KEY(id));
    if (cached) return cached;

    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException('Ready plan not found');
    const plan = this.toReadyPlan(record);
    await this.cacheManager.set(READY_PLAN_KEY(id), plan, READY_PLAN_TTL * 1000);
    return plan;
  }

  async create(input: CreateReadyPlanInput): Promise<ReadyPlan> {
    const record = await this.repo.create(input);
    await this.cacheManager.del(READY_PLANS_LIST_KEY);
    return this.toReadyPlan(record);
  }

  async update(id: string, input: UpdateReadyPlanInput): Promise<ReadyPlan> {
    const record = await this.repo.update(id, input);
    await this.bustCaches(id);
    return this.toReadyPlan(record);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.bustCaches(id);
  }

  async setPublished(id: string, isPublished: boolean): Promise<ReadyPlan> {
    const record = await this.repo.setPublished(id, isPublished);
    await this.bustCaches(id);
    return this.toReadyPlan(record);
  }

  private async bustCaches(id: string): Promise<void> {
    await Promise.all([
      this.cacheManager.del(READY_PLANS_LIST_KEY),
      this.cacheManager.del(READY_PLAN_KEY(id)),
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toSummary(r: any): ReadyPlanSummary {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const segments: any[] = r.itinerary?.segments ?? [];
    const destinations: string[] = segments.map((s: any) => s.destinationId as string);
    const totalDays: number = segments.reduce((acc: number, s: any) => {
      const days = s.days as unknown[];
      return acc + (Array.isArray(days) ? days.length : 0);
    }, 0);
    return {
      id: r.id as string,
      title: r.title as string,
      subtitle: r.subtitle as string,
      price: r.price as number,
      imgUrl: r.imgUrl as string,
      badge: r.badge as string | null,
      tags: r.tags as string[],
      isPublished: r.isPublished as boolean,
      destinations,
      totalDays,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toReadyPlan(r: any): ReadyPlan {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const itin: any = r.itinerary ?? {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const segments: any[] = itin.segments ?? [];
    return {
      ...this.toSummary(r),
      itinerary: {
        id: itin.id as string,
        title: itin.title as string | null,
        days: (itin.days as unknown[]) ?? [],
        costs: (itin.costs as ItineraryCosts) ?? { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 },
        segments: segments.map((s: any) => ({
          id: s.id as string,
          itineraryId: s.itineraryId as string,
          destinationId: s.destinationId as string,
          order: s.order as number,
          days: (s.days as unknown[]) ?? [],
          costs: (s.costs as ItineraryCosts) ?? { flights: 0, hotel: 0, food: 0, transport: 0, activities: 0 },
        })),
        createdAt: itin.createdAt as Date,
        updatedAt: itin.updatedAt as Date,
      },
    };
  }
}
```

- [ ] **Step 6: Run tests — they should pass now**

```bash
npx jest test/modules/ready-plans/ready-plans.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests pass.

- [ ] **Step 7: Create public controller**

`src/modules/ready-plans/ready-plans.controller.ts`:

```typescript
import { Controller, Get, Param, Post, Body, Request, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ReadyPlansService } from './ready-plans.service';

@Public()
@Controller('ready-plans')
export class ReadyPlansController {
  constructor(private readonly service: ReadyPlansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findByIdOrThrow(id);
  }
}
```

- [ ] **Step 8: Create admin controller**

`src/modules/ready-plans/admin-ready-plans.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReadyPlansService } from './ready-plans.service';
import type { CreateReadyPlanInput, UpdateReadyPlanInput } from './ready-plans.types';

@Controller('admin/ready-plans')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminReadyPlansController {
  constructor(private readonly service: ReadyPlansService) {}

  @Post()
  create(@Body() body: CreateReadyPlanInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateReadyPlanInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Body() body: { isPublished: boolean }) {
    return this.service.setPublished(id, body.isPublished);
  }
}
```

- [ ] **Step 9: Create module**

`src/modules/ready-plans/ready-plans.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ReadyPlansRepository } from './ready-plans.repository';
import { ReadyPlansService } from './ready-plans.service';
import { ReadyPlansController } from './ready-plans.controller';
import { AdminReadyPlansController } from './admin-ready-plans.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ReadyPlansController, AdminReadyPlansController],
  providers: [ReadyPlansRepository, ReadyPlansService],
  exports: [ReadyPlansService],
})
export class ReadyPlansModule {}
```

- [ ] **Step 10: Check TS**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 11: Commit**

```bash
git add src/modules/ready-plans/ test/modules/ready-plans/
git commit -m "feat: add ReadyPlansModule with cache-aside, admin CRUD, and publish toggle"
```

---

### Task 5: Experiences module

**Files:**
- Create: `src/modules/experiences/experiences.types.ts`
- Create: `src/modules/experiences/experiences.repository.ts`
- Create: `src/modules/experiences/experiences.service.ts`
- Create: `src/modules/experiences/experiences.controller.ts`
- Create: `src/modules/experiences/admin-experiences.controller.ts`
- Create: `src/modules/experiences/experiences.module.ts`
- Create: `test/modules/experiences/experiences.service.spec.ts`

- [ ] **Step 1: Write failing tests**

`test/modules/experiences/experiences.service.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { ExperiencesService } from '../../../src/modules/experiences/experiences.service';
import { ExperiencesRepository } from '../../../src/modules/experiences/experiences.repository';
import {
  EXPERIENCES_LIST_KEY,
  EXPERIENCE_KEY,
  EXPERIENCE_TTL,
} from '../../../src/cache/cache.constants';

const mockExperience = {
  id: 'bunkers-barselona',
  destinationId: 'barcelona',
  title: 'Saulėlydis Bunkers del Carmel',
  subtitle: 'Vietinių slapta vieta',
  category: 'gem',
  heroImgUrl: 'https://example.com/bunkers.jpg',
  price: 'Nemokama',
  duration: '2h',
  tags: ['gem', 'sunset'],
  content: { gallery: [], description: 'Aprašymas', highlights: [], insiderTip: '', bestTime: '' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ExperiencesService', () => {
  let service: ExperiencesService;
  let mockRepo: jest.Mocked<ExperiencesRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ExperiencesRepository>;

    mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    service = new ExperiencesService(
      mockRepo,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
  });

  describe('findAll', () => {
    it('returns cached list on cache hit', async () => {
      mockCache.get.mockResolvedValue([mockExperience]);
      const result = await service.findAll();
      expect(mockCache.get).toHaveBeenCalledWith(EXPERIENCES_LIST_KEY);
      expect(mockRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('fetches from DB on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockExperience]);
      const result = await service.findAll();
      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        EXPERIENCES_LIST_KEY,
        expect.any(Array),
        EXPERIENCE_TTL * 1000,
      );
      expect(result).toHaveLength(1);
    });

    it('filters by destinationId when provided', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockExperience]);
      await service.findAll('barcelona');
      expect(mockRepo.findAll).toHaveBeenCalledWith('barcelona');
    });
  });

  describe('findByIdOrThrow', () => {
    it('throws NotFoundException when not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns experience on cache miss + DB hit', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findById.mockResolvedValue(mockExperience);
      const result = await service.findByIdOrThrow('bunkers-barselona');
      expect(result.id).toBe('bunkers-barselona');
      expect(mockCache.set).toHaveBeenCalledWith(
        EXPERIENCE_KEY('bunkers-barselona'),
        expect.anything(),
        EXPERIENCE_TTL * 1000,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm fail**

```bash
npx jest test/modules/experiences/experiences.service.spec.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create types**

`src/modules/experiences/experiences.types.ts`:

```typescript
export interface ExperienceContent {
  gallery: string[];
  description: string;
  highlights: string[];
  insiderTip: string;
  bestTime: string;
}

export interface Experience {
  id: string;
  destinationId: string | null;
  title: string;
  subtitle: string;
  category: string;
  heroImgUrl: string;
  price: string;
  duration: string;
  tags: string[];
  content: ExperienceContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExperienceInput {
  id: string;
  destinationId?: string;
  title: string;
  subtitle: string;
  category: string;
  heroImgUrl: string;
  price: string;
  duration: string;
  tags?: string[];
  content?: ExperienceContent;
}

export interface UpdateExperienceInput {
  destinationId?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  heroImgUrl?: string;
  price?: string;
  duration?: string;
  tags?: string[];
  content?: ExperienceContent;
}
```

- [ ] **Step 4: Create repository**

`src/modules/experiences/experiences.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateExperienceInput, UpdateExperienceInput } from './experiences.types';

@Injectable()
export class ExperiencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(destinationId?: string) {
    return this.prisma.experience.findMany({
      where: destinationId ? { destinationId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.experience.findUnique({ where: { id } });
  }

  async create(input: CreateExperienceInput) {
    const { content, ...data } = input;
    return this.prisma.experience.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { ...data, content: (content ?? {}) as any },
    });
  }

  async update(id: string, input: UpdateExperienceInput) {
    const { content, ...data } = input;
    return this.prisma.experience.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: content !== undefined ? { ...data, content: content as any } : data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.experience.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Create service**

`src/modules/experiences/experiences.service.ts`:

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ExperiencesRepository } from './experiences.repository';
import {
  EXPERIENCES_LIST_KEY,
  EXPERIENCE_KEY,
  EXPERIENCE_TTL,
} from '../../cache/cache.constants';
import type {
  Experience,
  ExperienceContent,
  CreateExperienceInput,
  UpdateExperienceInput,
} from './experiences.types';

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly repo: ExperiencesRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(destinationId?: string): Promise<Experience[]> {
    const cacheKey = destinationId
      ? `${EXPERIENCES_LIST_KEY}:${destinationId}`
      : EXPERIENCES_LIST_KEY;
    const cached = await this.cacheManager.get<Experience[]>(cacheKey);
    if (cached) return cached;

    const records = await this.repo.findAll(destinationId);
    const experiences = records.map((r) => this.toExperience(r));
    await this.cacheManager.set(cacheKey, experiences, EXPERIENCE_TTL * 1000);
    return experiences;
  }

  async findByIdOrThrow(id: string): Promise<Experience> {
    const cached = await this.cacheManager.get<Experience>(EXPERIENCE_KEY(id));
    if (cached) return cached;

    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException('Experience not found');
    const experience = this.toExperience(record);
    await this.cacheManager.set(EXPERIENCE_KEY(id), experience, EXPERIENCE_TTL * 1000);
    return experience;
  }

  async create(input: CreateExperienceInput): Promise<Experience> {
    const record = await this.repo.create(input);
    await this.cacheManager.del(EXPERIENCES_LIST_KEY);
    return this.toExperience(record);
  }

  async update(id: string, input: UpdateExperienceInput): Promise<Experience> {
    const record = await this.repo.update(id, input);
    await Promise.all([
      this.cacheManager.del(EXPERIENCES_LIST_KEY),
      this.cacheManager.del(EXPERIENCE_KEY(id)),
    ]);
    return this.toExperience(record);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await Promise.all([
      this.cacheManager.del(EXPERIENCES_LIST_KEY),
      this.cacheManager.del(EXPERIENCE_KEY(id)),
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toExperience(r: any): Experience {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = (r.content as ExperienceContent) ?? {
      gallery: [],
      description: '',
      highlights: [],
      insiderTip: '',
      bestTime: '',
    };
    return {
      id: r.id as string,
      destinationId: r.destinationId as string | null,
      title: r.title as string,
      subtitle: r.subtitle as string,
      category: r.category as string,
      heroImgUrl: r.heroImgUrl as string,
      price: r.price as string,
      duration: r.duration as string,
      tags: r.tags as string[],
      content,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }
}
```

- [ ] **Step 6: Run tests — confirm pass**

```bash
npx jest test/modules/experiences/experiences.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 7: Create public controller**

`src/modules/experiences/experiences.controller.ts`:

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ExperiencesService } from './experiences.service';

@Public()
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Get()
  findAll(@Query('destinationId') destinationId?: string) {
    return this.service.findAll(destinationId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findByIdOrThrow(id);
  }
}
```

- [ ] **Step 8: Create admin controller**

`src/modules/experiences/admin-experiences.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ExperiencesService } from './experiences.service';
import type { CreateExperienceInput, UpdateExperienceInput } from './experiences.types';

@Controller('admin/experiences')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Post()
  create(@Body() body: CreateExperienceInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExperienceInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

- [ ] **Step 9: Create module**

`src/modules/experiences/experiences.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ExperiencesRepository } from './experiences.repository';
import { ExperiencesService } from './experiences.service';
import { ExperiencesController } from './experiences.controller';
import { AdminExperiencesController } from './admin-experiences.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ExperiencesController, AdminExperiencesController],
  providers: [ExperiencesRepository, ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
```

- [ ] **Step 10: Check TS**

```bash
npx tsc --noEmit
```

- [ ] **Step 11: Commit**

```bash
git add src/modules/experiences/ test/modules/experiences/
git commit -m "feat: add ExperiencesModule with destinationId filter, cache-aside, admin CRUD"
```

---

### Task 6: Testimonials module

**Files:**
- Create: `src/modules/testimonials/testimonials.types.ts`
- Create: `src/modules/testimonials/testimonials.repository.ts`
- Create: `src/modules/testimonials/testimonials.service.ts`
- Create: `src/modules/testimonials/testimonials.controller.ts`
- Create: `src/modules/testimonials/admin-testimonials.controller.ts`
- Create: `src/modules/testimonials/testimonials.module.ts`
- Create: `test/modules/testimonials/testimonials.service.spec.ts`

- [ ] **Step 1: Write failing tests**

`test/modules/testimonials/testimonials.service.spec.ts`:

```typescript
import { TestimonialsService } from '../../../src/modules/testimonials/testimonials.service';
import { TestimonialsRepository } from '../../../src/modules/testimonials/testimonials.repository';
import {
  TESTIMONIALS_LIST_KEY,
  TESTIMONIALS_TTL,
} from '../../../src/cache/cache.constants';

const mockTestimonial = {
  id: 't1',
  text: '"Puiku!"',
  author: 'Marta V.',
  city: 'Vilnius',
  initials: 'MV',
  colorHex: '#C2755C',
  destinationName: 'Barselona',
  tripDate: '2025 m. rugsėjis',
  highlight: 'Sutaupėme ~€280',
  savedAmount: '~€280',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let mockRepo: jest.Mocked<TestimonialsRepository>;
  let mockCache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TestimonialsRepository>;

    mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    service = new TestimonialsService(
      mockRepo,
      mockCache as unknown as import('@nestjs/cache-manager').Cache,
    );
  });

  describe('findAll', () => {
    it('returns cached list on cache hit', async () => {
      mockCache.get.mockResolvedValue([mockTestimonial]);
      const result = await service.findAll();
      expect(mockCache.get).toHaveBeenCalledWith(TESTIMONIALS_LIST_KEY);
      expect(mockRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('fetches from DB and caches on miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAll.mockResolvedValue([mockTestimonial]);
      const result = await service.findAll();
      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        TESTIMONIALS_LIST_KEY,
        expect.any(Array),
        TESTIMONIALS_TTL * 1000,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('busts list cache after create', async () => {
      mockRepo.create.mockResolvedValue(mockTestimonial);
      await service.create({
        id: 't1',
        text: '"Puiku!"',
        author: 'Marta V.',
        city: 'Vilnius',
        initials: 'MV',
        colorHex: '#C2755C',
      });
      expect(mockCache.del).toHaveBeenCalledWith(TESTIMONIALS_LIST_KEY);
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm fail**

```bash
npx jest test/modules/testimonials/testimonials.service.spec.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 3: Create types**

`src/modules/testimonials/testimonials.types.ts`:

```typescript
export interface Testimonial {
  id: string;
  text: string;
  author: string;
  city: string;
  initials: string;
  colorHex: string;
  destinationName: string | null;
  tripDate: string | null;
  highlight: string | null;
  savedAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTestimonialInput {
  id: string;
  text: string;
  author: string;
  city: string;
  initials: string;
  colorHex: string;
  destinationName?: string;
  tripDate?: string;
  highlight?: string;
  savedAmount?: string;
}

export interface UpdateTestimonialInput {
  text?: string;
  author?: string;
  city?: string;
  initials?: string;
  colorHex?: string;
  destinationName?: string;
  tripDate?: string;
  highlight?: string;
  savedAmount?: string;
}
```

- [ ] **Step 4: Create repository**

`src/modules/testimonials/testimonials.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateTestimonialInput, UpdateTestimonialInput } from './testimonials.types';

@Injectable()
export class TestimonialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.testimonial.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async create(input: CreateTestimonialInput) {
    return this.prisma.testimonial.create({ data: input });
  }

  async update(id: string, input: UpdateTestimonialInput) {
    return this.prisma.testimonial.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.testimonial.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Create service**

`src/modules/testimonials/testimonials.service.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TestimonialsRepository } from './testimonials.repository';
import { TESTIMONIALS_LIST_KEY, TESTIMONIALS_TTL } from '../../cache/cache.constants';
import type {
  Testimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from './testimonials.types';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly repo: TestimonialsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(): Promise<Testimonial[]> {
    const cached = await this.cacheManager.get<Testimonial[]>(TESTIMONIALS_LIST_KEY);
    if (cached) return cached;

    const records = await this.repo.findAll();
    await this.cacheManager.set(TESTIMONIALS_LIST_KEY, records, TESTIMONIALS_TTL * 1000);
    return records as Testimonial[];
  }

  async create(input: CreateTestimonialInput): Promise<Testimonial> {
    const record = await this.repo.create(input);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
    return record as Testimonial;
  }

  async update(id: string, input: UpdateTestimonialInput): Promise<Testimonial> {
    const record = await this.repo.update(id, input);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
    return record as Testimonial;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.cacheManager.del(TESTIMONIALS_LIST_KEY);
  }
}
```

- [ ] **Step 6: Run tests — confirm pass**

```bash
npx jest test/modules/testimonials/testimonials.service.spec.ts --no-coverage
```

Expected: PASS — 3 tests.

- [ ] **Step 7: Create public controller**

`src/modules/testimonials/testimonials.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { TestimonialsService } from './testimonials.service';

@Public()
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

- [ ] **Step 8: Create admin controller**

`src/modules/testimonials/admin-testimonials.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TestimonialsService } from './testimonials.service';
import type { CreateTestimonialInput, UpdateTestimonialInput } from './testimonials.types';

@Controller('admin/testimonials')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
export class AdminTestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Post()
  create(@Body() body: CreateTestimonialInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTestimonialInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

- [ ] **Step 9: Create module**

`src/modules/testimonials/testimonials.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TestimonialsRepository } from './testimonials.repository';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { AdminTestimonialsController } from './admin-testimonials.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [TestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsRepository, TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
```

- [ ] **Step 10: Check TS**

```bash
npx tsc --noEmit
```

- [ ] **Step 11: Commit**

```bash
git add src/modules/testimonials/ test/modules/testimonials/
git commit -m "feat: add TestimonialsModule with cache-aside and admin CRUD"
```

---

### Task 7: Register modules + seed data

**Files:**
- Modify: `src/app.module.ts`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Register 4 new modules in app.module.ts**

Add imports to `src/app.module.ts`:

```typescript
import { ItinerariesModule } from './modules/itineraries/itineraries.module';
import { ReadyPlansModule } from './modules/ready-plans/ready-plans.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
```

Add to the `imports` array (after `HotelsModule`):

```typescript
    ItinerariesModule,
    ReadyPlansModule,
    ExperiencesModule,
    TestimonialsModule,
```

- [ ] **Step 2: Verify app compiles**

```bash
npx tsc --noEmit && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Add seed data to prisma/seed.ts**

In `prisma/seed.ts`, after the hotels seeding block, add:

```typescript
  // ── Experiences ─────────────────────────────────────────────────────────────
  const experiences = [
    {
      id: 'bunkers-del-carmel-barselona',
      destinationId: 'barcelona',
      title: 'Saulėlydis Bunkers del Carmel',
      subtitle: 'Vietinių slapta vieta su geriausiu vaizdu į miestą',
      category: 'gem',
      heroImgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1920&q=85',
      price: 'Nemokama',
      duration: '2h',
      tags: ['Saulėlydis', 'Vietiniai', 'Nemokama'],
      content: {
        gallery: [
          'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=85',
          'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=800&q=85',
        ],
        description: 'Pilietinio karo bunkeriai virš Barselonos tapo slapčiausia miesto apžvalgos aikštele. 360° panorama nuo Sagrada Familia iki jūros.',
        highlights: ['360° panorama', 'Nemokamai — jokių bilietų', 'Vietinių mėgstamiausia vieta piknikui'],
        insiderTip: 'Ateik likus 45 min iki saulėlydžio — geriausia vieta greit užimama.',
        bestTime: 'Gegužė–rugsėjis 19:00–21:00',
      },
    },
    {
      id: 'sagrada-familia-early',
      destinationId: 'barcelona',
      title: 'Sagrada Família ankstyvas rytas',
      subtitle: 'Be minios, be triukšmo — tik Gaudí',
      category: 'culture',
      heroImgUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1920&q=85',
      price: '€26',
      duration: '2–3h',
      tags: ['Architektūra', 'Rytas', 'Gaudí'],
      content: {
        gallery: ['https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=85'],
        description: 'Bilietai 9:00 rytiniam įėjimui — minia atsiranda tik po 10:30. Šviesa pro vitražus ankstyvą rytą yra neįtikėtina.',
        highlights: ['Minimalios eilės iki 10:30', 'Ryto saulė per vitražus', 'Toweriai su miesto vaizdu'],
        insiderTip: 'Rezervuok Nativity ir Passion bokštų bilietą atskirai — vertas papildomo €5.',
        bestTime: 'Ištisus metus 9:00–10:30',
      },
    },
    {
      id: 'sintra-day-trip',
      destinationId: 'lisbon',
      title: 'Sintra be turistų',
      subtitle: '28 tramvajus 8:00 — pilys be eilių',
      category: 'adventure',
      heroImgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85',
      price: '€15–30',
      duration: 'Visą dieną',
      tags: ['Pilys', 'Rytas', 'Gamta'],
      content: {
        gallery: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85'],
        description: 'Traukinys 8:08 iš Rossio stoties. Pena rūmai atidaro 9:30 — esi ten pirmas.',
        highlights: ['Eilių nėra iki 11:00', 'Pena, Moorų pilis, Quinta da Regaleira', 'Vietiniai kavinukai, ne turistiniai'],
        insiderTip: 'Nusipirk kombinuotą bilietą — sutaupo ~€8.',
        bestTime: 'Visus metus, geriausia ne liepa–rugpjūtis',
      },
    },
    {
      id: 'marrakech-medina-walk',
      destinationId: 'marrakech',
      title: 'Medinos labirintai su vietiniu',
      subtitle: 'Tikra Marakešo siela — ne turistinė versija',
      category: 'culture',
      heroImgUrl: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1920&q=85',
      price: '€20–40',
      duration: '3–4h',
      tags: ['Kultūra', 'Maistas', 'Vietiniai'],
      content: {
        gallery: ['https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=85'],
        description: 'Su vietiniu gidu per siauruosius Medinos gatvelius — oda dirbtuves, prieskonių turgus, slapti kavinukai.',
        highlights: ['Autentiška patirtis be turistinių spąstų', 'Prieskonių pirkimas tiesiai iš gamintojų', 'Tradicinė arbatos ceremonija'],
        insiderTip: 'Derėkis visada — pirmoji kaina visada 3x per didelė.',
        bestTime: 'Spalis–balandis, anksti rytais',
      },
    },
    {
      id: 'paris-morning-market',
      destinationId: 'paris',
      title: 'Paryžiaus rytinis turgus',
      subtitle: 'Marché d\'Aligre — kaip tikri paryžiečiai',
      category: 'food',
      heroImgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=85',
      price: 'Nemokama',
      duration: '2h',
      tags: ['Maistas', 'Kultūra', 'Rytas'],
      content: {
        gallery: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85'],
        description: 'Marché d\'Aligre — šeštadieniais nuo 8:00. Šviežios daržovės, sūriai, vynas tiesiai iš gamintojų.',
        highlights: ['Autentiška, ne turistinė', 'Pigiausias maistas Paryžiuje', 'Vietiniai šefai perka čia'],
        insiderTip: 'Ateik prieš 10:00 — geriausias pasirinkimas dingsta greit.',
        bestTime: 'Šeštadieniais 8:00–13:00',
      },
    },
  ];

  for (const experience of experiences) {
    await prisma.experience.upsert({
      where: { id: experience.id },
      update: experience as any,
      create: experience as any,
    });
  }

  // ── Testimonials ─────────────────────────────────────────────────────────────
  const testimonials = [
    {
      id: 'marta-barcelona',
      text: '"Sagrada Familia bilietai buvo rezervuoti iš anksto, restoranai — tikri vietinių mėgstamiausieji. Cal Pep tapasai buvo nepamirštami. Sutaupėme ~€280 palyginus su organizuota kelione."',
      author: 'Marta V.',
      city: 'Vilnius',
      initials: 'MV',
      colorHex: '#C2755C',
      destinationName: 'Barselona',
      tripDate: '2025 m. rugsėjis',
      highlight: 'Sutaupėme ~€280 palyginus su organizuota kelione',
      savedAmount: '~€280',
    },
    {
      id: 'tomas-marrakech',
      text: '"Riad viešbutis, kurį mums parinko, buvo 10x geresnis nei bet kuris Booking pasiūlymas. Souks derybų patarimai sutaupė bent €100. Maistas — tikras marokietiškas, ne turistinis."',
      author: 'Tomas K.',
      city: 'Kaunas',
      initials: 'TK',
      colorHex: '#1A5C57',
      destinationName: 'Marakešas',
      tripDate: '2025 m. lapkritis',
      highlight: 'Riad viešbutis 10x geresnis nei Booking',
      savedAmount: '~€100',
    },
    {
      id: 'giedre-lisbon',
      text: '"28 tramvajus 8:00 ryte — buvome vieni. Sintra pilys be eilių. Pastéis de Belém tiesiog iš kepyklos. Viskas buvo suplanuota iki minutės."',
      author: 'Giedrė S.',
      city: 'Klaipėda',
      initials: 'GS',
      colorHex: '#3B82F6',
      destinationName: 'Lisabona',
      tripDate: '2025 m. spalis',
      highlight: 'Sintra pilys be eilių',
      savedAmount: null,
    },
    {
      id: 'jonas-paris',
      text: '"Paryžius be eilių prie Eifelio bokšto — stebuklas. Slaptų kavinukų sąrašas buvo vertingesnis nei bet kokia kelionių knyga. Rekomenduosiu visiems draugams."',
      author: 'Jonas M.',
      city: 'Šiauliai',
      initials: 'JM',
      colorHex: '#D97706',
      destinationName: 'Paryžius',
      tripDate: '2025 m. gegužė',
      highlight: 'Eifelio bokštas be eilių',
      savedAmount: '~€150',
    },
    {
      id: 'ruta-rome',
      text: '"Roma be turistų minios yra įmanoma! Vatikano muziejus 8:00 ryte — beveik tušti koridoriai. Graikų restoranas Trastevere — vertas kiekvieno euro."',
      author: 'Rūta P.',
      city: 'Panevėžys',
      initials: 'RP',
      colorHex: '#059669',
      destinationName: 'Roma',
      tripDate: '2025 m. kovas',
      highlight: 'Vatikanas beveik be eilių',
      savedAmount: '~€200',
    },
    {
      id: 'andrius-kyoto',
      text: '"Kioto sakurų sezonu — ir nė vieno traukinio vėlavimo. Vietinių rekomenduoti ryžių laukai Arashiyama vietoj bambukyno — geras patarimas, sutaupė 2 valandas eilėje."',
      author: 'Andrius B.',
      city: 'Vilnius',
      initials: 'AB',
      colorHex: '#C2755C',
      destinationName: 'Kijotas',
      tripDate: '2025 m. balandis',
      highlight: 'Arashiyama be eilių',
      savedAmount: null,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      update: testimonial as any,
      create: testimonial as any,
    });
  }

  // ── Ready Plans ───────────────────────────────────────────────────────────────
  // Create itineraries first, then attach ReadyPlans

  // Ready Plan 1: Barcelona 4 days
  const itin1 = await prisma.itinerary.upsert({
    where: { id: 'itin-vasara-barselona' },
    update: {},
    create: {
      id: 'itin-vasara-barselona',
      title: 'Vasaros savaitgalis Barselonoje',
      days: [
        { day: 1, activities: ['Gaudí maršrutas: Casa Batlló ir La Pedrera', 'Vakariena El Born kvartale'] },
        { day: 2, activities: ['Sagrada Família (iš anksto rezervuoti bilietai)', 'Park Güell saulėlydis'] },
        { day: 3, activities: ['Barceloneta paplūdimys', 'Tapasai La Boqueria turguje'] },
        { day: 4, activities: ['Montjuïc pilis', 'Skrydis namo'] },
      ],
      costs: { flights: 180, hotel: 320, food: 160, transport: 40, activities: 80 },
    },
  });

  await prisma.readyPlan.upsert({
    where: { id: 'vasara-barselona' },
    update: {},
    create: {
      id: 'vasara-barselona',
      itineraryId: itin1.id,
      title: 'Vasaros savaitgalis Barselonoje',
      subtitle: '4 dienos · Liepa 3–7, 2026',
      price: 999,
      imgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      badge: 'Populiarus',
      tags: ['Poroms', 'Vasara', 'Paplūdimys'],
      isPublished: true,
    },
  });

  // Ready Plan 2: Lisbon 5 days
  const itin2 = await prisma.itinerary.upsert({
    where: { id: 'itin-naujieji-lisabona' },
    update: {},
    create: {
      id: 'itin-naujieji-lisabona',
      title: 'Naujieji metai Lisabonoje',
      days: [
        { day: 1, activities: ['Alfama rajonas ir São Jorge pilis', 'Fado vakaras Mouraria'] },
        { day: 2, activities: ['Sintra dieninė ekskursija (8:08 traukinys)', 'Grįžimas saulėlydžiui'] },
        { day: 3, activities: ['Belém rajonas: Jerónimos, pastéis de Belém', 'LX Factory savaitgalio turgus'] },
        { day: 4, activities: ['Naujametinė šventė Praça do Comércio', 'Fejerverkai prie upės'] },
        { day: 5, activities: ['Príncipe Real rajonas', 'Skrydis namo'] },
      ],
      costs: { flights: 210, hotel: 400, food: 200, transport: 60, activities: 90 },
    },
  });

  await prisma.readyPlan.upsert({
    where: { id: 'naujieji-lisabona' },
    update: {},
    create: {
      id: 'naujieji-lisabona',
      itineraryId: itin2.id,
      title: 'Naujieji metai Lisabonoje',
      subtitle: '5 dienos · Gru 29 – Sau 3, 2027',
      price: 1290,
      imgUrl: 'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=600&q=80',
      badge: 'Sezoninis',
      tags: ['Poroms', 'Naujieji', 'Kultūra'],
      isPublished: true,
    },
  });

  // Ready Plan 3: Paris + Rome (multi-destination)
  const itin3 = await prisma.itinerary.upsert({
    where: { id: 'itin-paris-rome' },
    update: {},
    create: {
      id: 'itin-paris-rome',
      title: 'Paryžius + Roma 7 dienoms',
      days: [],
      costs: { flights: 350, hotel: 700, food: 420, transport: 130, activities: 200 },
    },
  });

  // Add segments for multi-dest itinerary
  const seg1exists = await prisma.itinerarySegment.findFirst({ where: { itineraryId: itin3.id, order: 1 } });
  if (!seg1exists) {
    await prisma.itinerarySegment.create({
      data: {
        itineraryId: itin3.id,
        destinationId: 'paris',
        order: 1,
        days: [
          { day: 1, activities: ['Eiffelio bokštas be eilių (9:00)', 'Le Marais rajonas'] },
          { day: 2, activities: ['Luvras (trečiadieniais iki 21:45)', 'Montmartre saulėlydis'] },
          { day: 3, activities: ['Versalis (anksti ryte)', 'Skrydis į Romą vakare'] },
        ],
        costs: { flights: 150, hotel: 360, food: 210, transport: 60, activities: 100 },
      },
    });
  }

  const seg2exists = await prisma.itinerarySegment.findFirst({ where: { itineraryId: itin3.id, order: 2 } });
  if (!seg2exists) {
    await prisma.itinerarySegment.create({
      data: {
        itineraryId: itin3.id,
        destinationId: 'rome',
        order: 2,
        days: [
          { day: 4, activities: ['Vatikano muziejus 8:00 (be eilių)', 'Šv. Petro bazilika'] },
          { day: 5, activities: ['Koliziejus ir Romos forumas', 'Trastevere vakaras'] },
          { day: 6, activities: ['Borghese galerija', 'Trevi fontanas auštant'] },
          { day: 7, activities: ['Laisvos pusryčiai Campo de\' Fiori', 'Skrydis namo'] },
        ],
        costs: { flights: 200, hotel: 340, food: 210, transport: 70, activities: 100 },
      },
    });
  }

  await prisma.readyPlan.upsert({
    where: { id: 'paris-roma-7d' },
    update: {},
    create: {
      id: 'paris-roma-7d',
      itineraryId: itin3.id,
      title: 'Paryžius + Roma 7 dienoms',
      subtitle: '7 dienų Europos klasika',
      price: 1799,
      imgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
      badge: 'Geriausias pasirinkimas',
      tags: ['Poroms', 'Kultūra', 'Europa'],
      isPublished: true,
    },
  });

  console.log('✅ Experiences, Testimonials, and ReadyPlans seeded');
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```

Expected: No errors. Last line: `✅ Experiences, Testimonials, and ReadyPlans seeded`

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All previously passing tests still pass. New tests (ready-plans, experiences, testimonials) pass.

- [ ] **Step 6: Commit**

```bash
git add src/app.module.ts prisma/seed.ts
git commit -m "feat: register new modules in AppModule and seed experiences, testimonials, ready plans"
```
