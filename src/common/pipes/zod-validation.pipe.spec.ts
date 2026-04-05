import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  const pipe = new ZodValidationPipe(schema);

  it('passes valid input through', () => {
    const result = pipe.transform({
      email: 'test@example.com',
      password: 'secret123',
    });
    expect(result).toEqual({
      email: 'test@example.com',
      password: 'secret123',
    });
  });

  it('throws BadRequestException on invalid input', () => {
    expect(() =>
      pipe.transform({ email: 'not-an-email', password: '123' }),
    ).toThrow(BadRequestException);
  });

  it('strips unknown fields', () => {
    const result = pipe.transform({
      email: 'test@example.com',
      password: 'secret123',
      extra: 'field',
    });
    expect(result).not.toHaveProperty('extra');
  });
});
