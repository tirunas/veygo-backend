# Veygo Backend

NestJS REST API for the Veygo travel planner. Handles authentication, payments, plan management, and email delivery.

## Tech Stack

- **NestJS** — framework
- **TypeScript** — strict mode
- **PostgreSQL** + **Prisma** — database and ORM
- **Redis** — session cache, rate limiting, password reset tokens
- **JWT** — RS256 access tokens + HttpOnly refresh cookie rotation
- **Stripe** — payment processing
- **Mailpit** — local email (SMTP dev server)
- **Docker Compose** — local infrastructure

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL, Redis, Mailpit)

## Local Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy env and fill in values
cp .env.example .env.development

# 4. Run migrations and seed
npx prisma migrate dev
npx ts-node prisma/seed.ts

# 5. Start dev server
npm run start:dev
```

API runs on `http://localhost:3001`.  
Mailpit UI at `http://localhost:8025`.

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | RS256 key pair (PEM) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM` | SMTP config (Mailpit locally) |

## API Endpoints

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns access token + sets refresh cookie |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/logout` | JWT | Logout current session |
| POST | `/auth/logout-all` | JWT | Revoke all sessions |
| GET | `/auth/me` | JWT | Current user profile |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

### Plans — `/plans`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | JWT | List user's plans |
| GET | `/plans/:id` | JWT | Get plan by ID |
| POST | `/plans` | JWT | Create plan |
| PATCH | `/plans/:id` | JWT | Update plan |

### Payments — `/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/stripe/intent` | JWT | Create Stripe payment intent |
| POST | `/payments/stripe/webhook` | Public | Stripe webhook handler |

### Other

- `GET /health` — health check
- `GET /destinations` — destination catalogue
- `GET /search` — search destinations

## Project Structure

```
src/
├── config/          — Joi config schema, config module
├── common/          — guards, decorators, pipes, filters
├── modules/
│   ├── auth/        — JWT auth, login, register, password reset
│   ├── users/       — user CRUD, repository
│   ├── email/       — nodemailer email service
│   ├── plans/       — travel plan management
│   ├── payments/    — Stripe integration
│   ├── destinations/— destination data
│   ├── search/      — search service
│   ├── pricing/     — pricing logic
│   └── jobs/        — scheduled jobs
└── prisma/          — Prisma service
```

## Scripts

```bash
npm run start:dev     # Dev server with watch
npm run build         # Production build
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run lint          # ESLint
npm run format        # Prettier
```

## Database

```bash
npx prisma migrate dev        # Apply migrations
npx prisma migrate deploy     # Apply in production
npx prisma studio             # GUI for database
npx ts-node prisma/seed.ts    # Seed destinations
```
