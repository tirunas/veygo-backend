import { configSchema } from '../../src/config/config.schema';

describe('configSchema', () => {
  it('passes with all required fields present', () => {
    const { error } = configSchema.validate({
      PORT: 3001,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://u:p@localhost/db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      JWT_PRIVATE_KEY: 'private-key',
      JWT_PUBLIC_KEY: 'public-key',
      JWT_ACCESS_TTL: 900,
      JWT_REFRESH_TTL: 604800,
      BCRYPT_ROUNDS: 1,
      THROTTLE_TTL: 60000,
      THROTTLE_LIMIT: 200,
      APP_URL: 'http://localhost:3000',
      CORS_ORIGINS: 'http://localhost:3000',
      MONTONIO_ACCESS_KEY: 'test-access-key',
      MONTONIO_SECRET_KEY: 'test-secret-key-32-chars-minimum-length',
      MONTONIO_BASE_URL: 'https://sandbox-merchant.montonio.com',
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
    });
    expect(error).toBeUndefined();
  });

  it('fails when DATABASE_URL is missing', () => {
    const { error } = configSchema.validate({ PORT: 3001, NODE_ENV: 'test' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('DATABASE_URL');
  });
});
