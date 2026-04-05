import * as Joi from 'joi';

export const configSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.number().default(900),
  JWT_REFRESH_TTL: Joi.number().default(604800),
  BCRYPT_ROUNDS: Joi.number().default(12),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(200),
  APP_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().required(),
  MONTONIO_ACCESS_KEY: Joi.string().required(),
  MONTONIO_SECRET_KEY: Joi.string().required(),
  MONTONIO_BASE_URL: Joi.string()
    .uri()
    .default('https://sandbox-merchant.montonio.com'),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
});
