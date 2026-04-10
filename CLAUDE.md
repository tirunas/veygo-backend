# Veygo Backend

NestJS REST API. Runs on port 3201.

## Commands
```bash
docker compose up -d          # Start PostgreSQL, Redis, Mailpit
docker compose up -d directus  # Directus admin UI → http://localhost:8155 (admin@veygo.dev / veygo_admin_dev)
npm run start:dev             # Dev server with watch
npm run build                 # Production build
npm run test                  # Unit tests
npm run test:e2e              # E2E tests
npm run lint                  # ESLint
npm run format                # Prettier
```

## Database
```bash
npx prisma migrate dev        # Run migrations
npx prisma studio             # GUI
npx ts-node prisma/seed.ts    # Seed destinations/data
```

## Environment
Copy `.env.example` → `.env.development`. Required:
- `DATABASE_URL` — postgres://veygo:veygo_dev@localhost:5534/veygo (local Docker)
- `REDIS_HOST` / `REDIS_PORT`
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — RS256 PEM pair
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST` / `SMTP_PORT` — Mailpit on localhost:1025

## Architecture
```
src/
├── config/          — Joi validation schema for env vars
├── common/          — guards, decorators, pipes, exception filters
└── modules/
    ├── auth/        — JWT, login, register, refresh, password reset
    ├── users/       — user CRUD + repository pattern
    ├── email/       — nodemailer via Mailpit locally
    ├── plans/       — UserPlan management
    ├── payments/    — Stripe intent + webhook
    ├── destinations/— destination catalogue (seeded)
    ├── attractions/ — per-destination attractions
    ├── hotels/      — hotel data
    ├── restaurants/ — restaurant data
    ├── ready-plans/ — pre-configured itineraries
    ├── search/      — cross-entity search
    ├── pricing/     — pricing logic
    ├── pipeline/    — data ingestion pipeline
    ├── geo-matching/— geo coordinate matching
    ├── itineraries/ — itinerary generation
    ├── experiences/ — travel experiences
    ├── testimonials/— user testimonials
    └── jobs/        — scheduled tasks
```

## Key Patterns
- **Repository pattern** in `users/` — follow this for new data access
- **Config**: all env vars validated via Joi in `config/`; inject `ConfigService`, never `process.env` directly
- **Guards**: `JwtAuthGuard` for protected routes, `RolesGuard` for admin; apply at controller level
- **Auth**: RS256 JWT access token (15m) + HttpOnly refresh cookie (7d, token family rotation)
- **Stripe webhook**: raw body required — do not add body parsers that consume the stream before the webhook handler

## Gotchas
- Docker maps Postgres to **5534** (not 5432) and Redis to **6480** (not 6379) to avoid conflicts with other local services
- Refresh token rotation uses token families — reuse of a revoked token invalidates the entire family
- Seed data is read from JSON files in `prisma/`; re-running seed is idempotent (upsert)
- E2E tests require a running test database — set `DATABASE_URL` to a separate test DB
- Directus shares the `veygo` Postgres DB but owns only `directus_*` tables. Prisma owns all schema migrations — never use Directus to create or alter tables.
