import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// In-memory store simulating DB
const users: Record<
  string,
  {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    loginAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
> = {};
const refreshTokens: Record<
  string,
  {
    id: string;
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    user: { role: string };
  }
> = {};
const auditLogs: unknown[] = [];

function findUserByEmail(email: string) {
  return Object.values(users).find((u) => u.email === email) ?? null;
}

const mockPrisma = {
  user: {
    findUnique: jest.fn((args: { where: { email?: string; id?: string } }) => {
      const { email, id } = args.where;
      if (email) return Promise.resolve(findUserByEmail(email));
      if (id) return Promise.resolve(users[id] ?? null);
      return Promise.resolve(null);
    }),
    create: jest.fn(
      (args: {
        data: { email: string; passwordHash: string; role?: string };
      }) => {
        const id = `user-${Date.now()}`;
        const user = {
          id,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          role: args.data.role ?? 'USER',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users[id] = user;
        return Promise.resolve(user);
      },
    ),
    update: jest.fn(
      (args: { where: { id: string }; data: Record<string, unknown> }) => {
        if (users[args.where.id])
          Object.assign(users[args.where.id], args.data);
        return Promise.resolve(users[args.where.id]);
      },
    ),
    deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
  },
  refreshToken: {
    create: jest.fn(
      (args: {
        data: {
          userId: string;
          tokenHash: string;
          family: string;
          expiresAt: Date;
        };
      }) => {
        const id = `rt-${Date.now()}-${Math.random()}`;
        const user = users[args.data.userId];
        const token = {
          id,
          ...args.data,
          revokedAt: null,
          createdAt: new Date(),
          user: { role: user?.role ?? 'USER' },
        };
        refreshTokens[args.data.tokenHash] = token;
        return Promise.resolve(token);
      },
    ),
    findFirst: jest.fn(
      (args: {
        where: {
          tokenHash?: string;
          revokedAt?: null;
          expiresAt?: { gt: Date };
        };
        include?: { user: boolean };
      }) => {
        const { tokenHash, revokedAt, expiresAt } = args.where;
        const token = tokenHash ? refreshTokens[tokenHash] : null;
        if (!token) return Promise.resolve(null);
        if (revokedAt === null && token.revokedAt !== null)
          return Promise.resolve(null);
        if (expiresAt?.gt && token.expiresAt <= expiresAt.gt)
          return Promise.resolve(null);
        return Promise.resolve(token);
      },
    ),
    updateMany: jest.fn(
      (args: {
        where: { tokenHash?: string; family?: string };
        data: { revokedAt: Date };
      }) => {
        const { tokenHash, family } = args.where;
        let count = 0;
        Object.values(refreshTokens).forEach((t) => {
          if (
            (tokenHash && t.tokenHash === tokenHash) ||
            (family && t.family === family)
          ) {
            t.revokedAt = args.data.revokedAt;
            count++;
          }
        });
        return Promise.resolve({ count });
      },
    ),
    deleteMany: jest.fn((args: { where: { userId: string } }) => {
      let count = 0;
      Object.keys(refreshTokens).forEach((key) => {
        if (refreshTokens[key].userId === args.where.userId) {
          delete refreshTokens[key];
          count++;
        }
      });
      return Promise.resolve({ count });
    }),
  },
  auditLog: {
    create: jest.fn((args: { data: unknown }) => {
      auditLogs.push(args.data);
      return Promise.resolve({ id: `log-${Date.now()}` });
    }),
    deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
  },
  $queryRaw: jest.fn(() => Promise.resolve([{ 1: 1 }])),
};

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates a new user and returns accessToken', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@e2e-test.lt', password: 'password123' })
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data).toHaveProperty('accessToken');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data.user).toHaveProperty('email', 'new@e2e-test.lt');

      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 409 when email already registered', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'duplicate@e2e-test.lt', password: 'password123' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'duplicate@e2e-test.lt', password: 'password123' })
        .expect(409);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid email', () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400));
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'login-test@e2e-test.lt', password: 'password123' });
    });

    it('returns accessToken and sets refresh cookie on valid credentials', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-test@e2e-test.lt', password: 'password123' })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data).toHaveProperty('accessToken');

      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 on wrong password', () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-test@e2e-test.lt', password: 'wrongpassword' })
        .expect(401));

    it('returns 401 for non-existent email', () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@e2e-test.lt', password: 'password123' })
        .expect(401));
  });

  describe('GET /auth/me', () => {
    it('returns current user when valid token provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-test@e2e-test.lt', password: 'password123' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const { accessToken } = loginRes.body.data;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data).toHaveProperty('email', 'login-test@e2e-test.lt');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 401 without token', () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      request(app.getHttpServer()).get('/auth/me').expect(401));
  });

  describe('POST /auth/refresh', () => {
    it('returns new accessToken using refresh cookie', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-test@e2e-test.lt', password: 'password123' });

      const cookie = loginRes.headers['set-cookie'];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookie)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });
});
