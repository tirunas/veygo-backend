import {
  LoggingInterceptor,
  stripSensitiveFields,
} from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  it('passes request through without modification', (done) => {
    const interceptor = new LoggingInterceptor();
    const mockRequest = { method: 'GET', url: '/health' };
    const mockResponse = { statusCode: 200 };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;
    const mockHandler: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toBe('ok');
      done();
    });
  });
});

describe('stripSensitiveFields', () => {
  it('strips password, token, cardNumber, tokenHash fields', () => {
    const result = stripSensitiveFields({
      email: 'a@b.com',
      password: 'secret',
      token: 'abc',
      cardNumber: '1234',
      tokenHash: 'hash',
    });
    expect(result).toEqual({ email: 'a@b.com' });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('cardNumber');
    expect(result).not.toHaveProperty('tokenHash');
  });

  it('leaves non-sensitive fields intact', () => {
    const result = stripSensitiveFields({ id: '1', name: 'Alice' });
    expect(result).toEqual({ id: '1', name: 'Alice' });
  });
});
