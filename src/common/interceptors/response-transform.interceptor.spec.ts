import { ResponseTransformInterceptor } from './response-transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseTransformInterceptor', () => {
  it('wraps response in data envelope', (done) => {
    const interceptor = new ResponseTransformInterceptor();
    const mockContext = {
      switchToHttp: () => ({ getResponse: () => ({}) }),
    } as ExecutionContext;
    const mockHandler: CallHandler = {
      handle: () => of({ name: 'Barcelona' }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual({ name: 'Barcelona' });
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('requestId');
      expect(result.meta).toHaveProperty('timestamp');
      done();
    });
  });
});
