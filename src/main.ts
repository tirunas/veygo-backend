import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);
  app.use(helmet());
  app.use(cookieParser());

  const corsOrigins = config.get<string>('CORS_ORIGINS')!.split(',');
  app.enableCors({ origin: corsOrigins, credentials: true });

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
}

void bootstrap();
