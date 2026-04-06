# Live Data Migration Design

> All remaining static/mock data migrated to live backend. Frontend fetches all content from API.

---

## Goal

Replace every `MOCK_*` constant and static data import in the frontend with real API calls backed by a NestJS + Prisma backend. Routes (marsrutai) are removed from the product. ReadyPlans are admin-curated static packages. Customer plans are editable single-destination itineraries.

---

## Database Schema

### New Models

```prisma
model Itinerary {
  id        String   @id @default(cuid())
  title     String?
  days      Json     // Day[] — empty array for multi-destination parent
  costs     Json     // { flights, hotel, food, transport, activities }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  segments  ItinerarySegment[]
  plan      Plan?
  readyPlan ReadyPlan?
}

model ItinerarySegment {
  id            String @id @default(cuid())
  itineraryId   String
  destinationId String
  order         Int
  days          Json
  costs         Json

  itinerary     Itinerary   @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  destination   Destination @relation(fields: [destinationId], references: [id])
}

model Plan {
  id            String   @id @default(cuid())
  userId        String
  destinationId String
  itineraryId   String   @unique
  status        String   @default("draft") // 'draft' | 'active' | 'completed'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  itinerary     Itinerary   @relation(fields: [itineraryId], references: [id])
  destination   Destination @relation(fields: [destinationId], references: [id])
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

  itinerary   Itinerary          @relation(fields: [itineraryId], references: [id])
  purchases   ReadyPlanPurchase[]
}

model ReadyPlanPurchase {
  id          String   @id @default(cuid())
  userId      String
  readyPlanId String
  amount      Int
  purchasedAt DateTime @default(now())

  readyPlan   ReadyPlan @relation(fields: [readyPlanId], references: [id])
}

model Experience {
  id            String   @id   // slug
  destinationId String?
  title         String
  subtitle      String
  category      String
  heroImgUrl    String
  price         String
  duration      String
  tags          String[]
  content       Json     // { gallery, description, highlights, insiderTip, bestTime }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
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

### Existing Model Changes

`Destination` already has `lat`, `lng`, `radiusKm` from the POI migration. No changes needed.

---

## Backend Modules

Each module follows the established POI pattern:
`Repository → Service (cache-aside) → Public Controller (@Public()) + Admin Controller (@Roles(ADMIN) + @UseGuards(RolesGuard)) → Module`

### `itineraries` module

**Files:**
- `src/modules/itineraries/itineraries.types.ts`
- `src/modules/itineraries/itineraries.repository.ts`
- `src/modules/itineraries/itineraries.service.ts`
- `src/modules/itineraries/itineraries.controller.ts` — `@Public()`
- `src/modules/itineraries/admin-itineraries.controller.ts`
- `src/modules/itineraries/itineraries.module.ts`

**Public endpoints:**
- `GET /itineraries/:id` — full itinerary with segments

**Admin endpoints:**
- `POST /itineraries` — create itinerary (optionally with segments)
- `PATCH /itineraries/:id`
- `DELETE /itineraries/:id`
- `POST /itineraries/:id/segments` — add segment to multi-dest itinerary
- `DELETE /itineraries/:id/segments/:segmentId`

**Cache:** `ITINERARY_KEY(id)` → 1-hour TTL. Bust on any write.

### `plans` module

**Files:**
- `src/modules/plans/plans.types.ts`
- `src/modules/plans/plans.repository.ts`
- `src/modules/plans/plans.service.ts`
- `src/modules/plans/plans.controller.ts` — `@Public()` (JWT-protected via global guard)
- `src/modules/plans/plans.module.ts`

No admin controller — plans are user-owned.

**Endpoints:**
- `POST /plans` — create plan + itinerary in one transaction. Body: `{ destinationId, days, costs }`
- `GET /plans/:id` — fetch plan with itinerary
- `PATCH /plans/:id` — update itinerary days/costs
- `DELETE /plans/:id`

**Cache:** No cache — plans are user-specific and mutable.

### `ready-plans` module

**Files:**
- `src/modules/ready-plans/ready-plans.types.ts`
- `src/modules/ready-plans/ready-plans.repository.ts`
- `src/modules/ready-plans/ready-plans.service.ts`
- `src/modules/ready-plans/ready-plans.controller.ts` — `@Public()`
- `src/modules/ready-plans/admin-ready-plans.controller.ts`
- `src/modules/ready-plans/ready-plans.module.ts`

**Public endpoints:**
- `GET /ready-plans` — published list with destination ids + totalDays computed
- `GET /ready-plans/:id` — full with nested itinerary segments
- `POST /ready-plans/:id/purchase` — record purchase (requires auth)

**Admin endpoints:**
- `POST /ready-plans` — create with itineraryId
- `PATCH /ready-plans/:id`
- `DELETE /ready-plans/:id`
- `PATCH /ready-plans/:id/publish` — toggle isPublished

**Cache:**
- `READY_PLANS_LIST_KEY` → 1-hour TTL, bust on any admin write
- `READY_PLAN_KEY(id)` → 1-hour TTL, bust on update/publish/delete

### `experiences` module

**Files:**
- `src/modules/experiences/experiences.types.ts`
- `src/modules/experiences/experiences.repository.ts`
- `src/modules/experiences/experiences.service.ts`
- `src/modules/experiences/experiences.controller.ts` — `@Public()`
- `src/modules/experiences/admin-experiences.controller.ts`
- `src/modules/experiences/experiences.module.ts`

**Public endpoints:**
- `GET /experiences` — supports `?destinationId=` filter
- `GET /experiences/:id`

**Admin endpoints:** `POST`, `PATCH /experiences/:id`, `DELETE /experiences/:id`

**Cache:** `EXPERIENCES_LIST_KEY`, `EXPERIENCE_KEY(id)` → 7-day TTL (same as attractions).

### `testimonials` module

**Files:**
- `src/modules/testimonials/testimonials.types.ts`
- `src/modules/testimonials/testimonials.repository.ts`
- `src/modules/testimonials/testimonials.service.ts`
- `src/modules/testimonials/testimonials.controller.ts` — `@Public()`
- `src/modules/testimonials/admin-testimonials.controller.ts`
- `src/modules/testimonials/testimonials.module.ts`

**Public endpoints:**
- `GET /testimonials` — full list

**Admin endpoints:** `POST`, `PATCH /testimonials/:id`, `DELETE /testimonials/:id`

**Cache:** `TESTIMONIALS_LIST_KEY` → 24-hour TTL.

---

## API Response Shapes

### `GET /ready-plans` (list item)
```json
{
  "id": "paris-rome-5d",
  "title": "Paryžius + Roma 5 dienoms",
  "subtitle": "Klasikinis Europos duetas",
  "price": 1290,
  "imgUrl": "https://...",
  "badge": "Populiariausia",
  "tags": ["romantic", "cultural"],
  "isPublished": true,
  "destinations": ["paris", "rome"],
  "totalDays": 5
}
```

### `GET /ready-plans/:id` (full)
```json
{
  "id": "paris-rome-5d",
  "title": "...",
  "subtitle": "...",
  "price": 1290,
  "imgUrl": "...",
  "badge": "...",
  "tags": [...],
  "itinerary": {
    "id": "cuid",
    "segments": [
      {
        "order": 1,
        "destinationId": "paris",
        "days": [...],
        "costs": { "flights": 200, "hotel": 150, "food": 80, "transport": 30, "activities": 50 }
      }
    ]
  }
}
```

### `GET /experiences` (list item)
```json
{
  "id": "paris-cooking-class",
  "title": "Prancūziška kepimo pamoka",
  "subtitle": "...",
  "category": "culinary",
  "heroImgUrl": "...",
  "price": "€89",
  "duration": "3h",
  "tags": ["food", "hands-on"],
  "destinationId": "paris"
}
```

### `GET /experiences/:id` (full)
```json
{
  ...listFields,
  "content": {
    "gallery": ["..."],
    "description": "...",
    "highlights": ["..."],
    "insiderTip": "...",
    "bestTime": "..."
  }
}
```

### `GET /testimonials`
```json
[{
  "id": "t1",
  "text": "...",
  "author": "Marta",
  "city": "Vilnius",
  "initials": "MK",
  "colorHex": "#C2755C",
  "highlight": "Sutaupėme 40%",
  "savedAmount": "€340",
  "destinationName": "Barselona",
  "tripDate": "2024-08"
}]
```

### `POST /plans` request / response
```json
// Request
{ "destinationId": "paris", "days": [...], "costs": { "flights": 0, "hotel": 0, "food": 0, "transport": 0, "activities": 0 } }

// Response
{ "id": "clx...", "itineraryId": "clx...", "destinationId": "paris", "status": "draft" }
```

---

## Frontend Wiring

### Home page (`domains/home/`)

**Replace:**
- `MOCK_DESTINATIONS` → `GET /destinations` via existing `destination.service.ts`
- Static ready plans → `GET /ready-plans` via new `ready-plan.service.ts`
- Static testimonials → `GET /testimonials` via new `testimonial.service.ts`

**Fix slug routing:**
- `HomePageClient.tsx`: remove `findIndex` pattern, use `destination.id` directly as slug
- Route: `/destination/${destination.id}` (not index-based)

**New files:**
- `src/domains/home/services/testimonial.service.ts`
- `src/domains/home/hooks/useTestimonials.ts`

### Discover page (`domains/discover/`)

- Remove Routes tab + all route static data imports
- Destinations already wired — verify filter params pass through

### Ready Plan page (`domains/ready-plan/`)

**Replace:**
- Static ready plan data → `GET /ready-plans/:id`
- Render `itinerary.segments` in order

**New/modified files:**
- `src/domains/ready-plan/services/ready-plan.service.ts` — replace static with API call
- `src/domains/ready-plan/services/ready-plan.mapper.ts` — map backend DTO to frontend type

### Experiences pages (`domains/patirtys/`)

**Replace:**
- Static list → `GET /experiences`
- Static detail → `GET /experiences/:id`

**New/modified files:**
- `src/domains/patirtys/services/experience.service.ts`
- `src/domains/patirtys/services/experience.mapper.ts`

### Plan builder (`domains/plan/`)

**Replace:**
- `getHotelsForDestination(name)` → `GET /hotels?destinationId=`
- On plan save/completion: `POST /plans`

**Modified files:**
- `src/domains/plan/services/plan.service.ts` — add `savePlan(destinationId, days, costs)`
- `src/domains/plan/services/hotel.service.ts` — already created, already uses `/hotels?destinationId=`

---

## Removed from Product

- `/route/[id]` page — deleted
- Routes tab on `/discover` — removed
- All static route data (`src/shared/data/routes.ts` or equivalent) — deleted
- `Route` Prisma model — not added

---

## Seed Data

All new models require seed data in `prisma/seed.ts`:
- 2–3 `ReadyPlan` records each with 1–3 `ItinerarySegment`s pointing to existing destinations
- 5–8 `Experience` records across existing destinations
- 6–8 `Testimonial` records

---

## Cache Constants (additions to `cache.constants.ts`)

```typescript
export const ITINERARY_KEY = (id: string) => `itinerary:${id}`
export const ITINERARY_TTL = 3600 // 1 hour

export const READY_PLANS_LIST_KEY = 'ready-plans:list'
export const READY_PLAN_KEY = (id: string) => `ready-plan:${id}`
export const READY_PLAN_TTL = 3600 // 1 hour

export const EXPERIENCES_LIST_KEY = 'experiences:list'
export const EXPERIENCE_KEY = (id: string) => `experience:${id}`
export const EXPERIENCE_TTL = 604800 // 7 days

export const TESTIMONIALS_LIST_KEY = 'testimonials:list'
export const TESTIMONIALS_TTL = 86400 // 24 hours
```

---

## Module Registration

All new modules added to `src/app.module.ts` imports:
`ItinerariesModule`, `PlansModule`, `ReadyPlansModule`, `ExperiencesModule`, `TestimonialsModule`
