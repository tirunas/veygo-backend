# Veygo — Travel Planner

Veygo is a premium travel planning platform built for Lithuanian travelers. Users explore destinations, build personalized multi-day itineraries, pick flights and hotels, and get a day-by-day plan — all in one flow.

## Repository Structure

```
traveling/
├── veygo-next/      # Frontend — Next.js 16 + React + TypeScript + Tailwind CSS v4
└── veygo-backend/   # Backend — NestJS + Prisma + PostgreSQL + Redis
```

## Tech Stack

**Frontend (`veygo-next/`)**
- Next.js 16 (App Router, SSR/SSG)
- React 19 + TypeScript 5 (strict)
- Tailwind CSS v4 with custom Veygo design tokens
- shadcn/ui (Radix UI primitives)
- MapLibre GL + react-map-gl + supercluster

**Backend (`veygo-backend/`)**
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Redis (session/cache)
- Winston structured logging
- Docker Compose for local infra

## Getting Started

### Frontend

```bash
cd veygo-next
npm install
npm run dev        # http://localhost:3000
```

No `.env` required — all data is static (mock). Map tiles use public CartoDB CDN (no API key needed).

### Backend

```bash
cd veygo-backend
docker-compose up -d   # Start Postgres + Redis
npm install
npm run start:dev      # http://localhost:3001
```

Copy `.env.example` to `.env` and fill in database credentials before starting.

## Key Features

- **18 destinations** with attractions, food, hotels, and pricing
- **12 multi-day routes** with full itineraries
- **3 ready-made plans** for quick booking
- **Plan builder** — flights, hotels, day-by-day timeline, interactive map
- **Payment flow** — users pay per destination to unlock the plan builder
- **Promo codes** — `VEYGO10` (10%), `PIRMA` (20%), `DRAUGAI` (15%)

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `veygo-next/` | `npm run dev` | Dev server |
| `veygo-next/` | `npm run build` | Production build |
| `veygo-next/` | `npm run lint` | ESLint |
| `veygo-next/` | `npm run format` | Prettier |
| `veygo-backend/` | `npm run start:dev` | Dev server with hot reload |
| `veygo-backend/` | `npm run test` | Unit tests |
| `veygo-backend/` | `npm run build` | Production build |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — hero, destinations, ready plans, testimonials |
| `/discover` | Filter + search destinations and routes |
| `/destination/[id]` | Attractions, food, itinerary, pricing |
| `/plan/[id]` | Plan builder — flights, hotels, timeline |
| `/ready-plan/[id]` | Pre-configured itinerary + checkout |
| `/route/[id]` | Multi-stop itinerary |
| `/patirtys` | Experiences |
| `/mano-planai` | Saved plans |

## Architecture

The frontend follows Domain-Driven Design:

```
veygo-next/src/
├── app/        # Next.js routes (thin shell)
├── domains/    # Feature domains (plan, destination, discover, route, home…)
└── shared/     # Cross-domain: ui, layout, map, hooks, lib, services, data
```

Domain components only import from `shared/`. No cross-domain imports.
