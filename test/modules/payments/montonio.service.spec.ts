import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { MontonioService } from '../../../src/modules/payments/montonio.service';

// Build a valid HS256 JWT for testing webhook verification
function buildMontonioJwt(
  secretKey: string,
  payload: Record<string, unknown>,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secretKey)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

describe('MontonioService', () => {
  const mockConfig = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        MONTONIO_ACCESS_KEY: 'test-access-key',
        MONTONIO_SECRET_KEY: 'test-secret-key',
        MONTONIO_BASE_URL: 'https://sandbox-merchant.montonio.com',
        APP_URL: 'https://app.example.com',
      };
      return values[key];
    }),
  };

  let service: MontonioService;

  beforeEach(() => {
    service = new MontonioService(mockConfig as any);
  });

  describe('verifyWebhookJwt', () => {
    it('returns decoded payload for valid JWT', () => {
      const payload = {
        merchant_reference: 'order-1',
        payment_status: 'PAID',
      };
      const token = buildMontonioJwt('test-secret-key', payload);
      const result = service.verifyWebhookJwt(token);
      expect(result.merchant_reference).toBe('order-1');
      expect(result.payment_status).toBe('PAID');
    });

    it('throws UnauthorizedException for invalid signature', () => {
      const payload = { merchant_reference: 'order-1', payment_status: 'PAID' };
      const token = buildMontonioJwt('wrong-secret-key', payload);
      expect(() => service.verifyWebhookJwt(token)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for malformed token', () => {
      expect(() => service.verifyWebhookJwt('not.a.valid.jwt.token')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
