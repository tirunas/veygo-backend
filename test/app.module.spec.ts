import { Test, TestingModule } from '@nestjs/testing';
import type { LoggerService } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('AppModule - Winston Logger Configuration', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should provide Winston logger', () => {
    const logger = module.get<LoggerService>(WINSTON_MODULE_PROVIDER);
    expect(logger).toBeDefined();
  });

  it('should have log method on logger', () => {
    const logger = module.get<LoggerService>(WINSTON_MODULE_PROVIDER);
    expect(typeof logger.log).toBe('function');
  });

  it('should have error method on logger', () => {
    const logger = module.get<LoggerService>(WINSTON_MODULE_PROVIDER);
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method on logger', () => {
    const logger = module.get<LoggerService>(WINSTON_MODULE_PROVIDER);
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method on logger', () => {
    const logger = module.get<LoggerService>(WINSTON_MODULE_PROVIDER);
    expect(typeof logger.debug).toBe('function');
  });
});
