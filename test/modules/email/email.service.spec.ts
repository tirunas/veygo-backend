import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../src/modules/email/email.service';

const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

import nodemailer from 'nodemailer';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const cfg: Record<string, unknown> = {
                SMTP_HOST: 'localhost',
                SMTP_PORT: 1025,
                SMTP_FROM: 'noreply@veygo.dev',
              };
              return cfg[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  it('creates nodemailer transport on init', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  });

  it('sends password reset email with token link', async () => {
    await service.sendPasswordReset('user@example.com', 'abc-token-123');

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('reset'),
        text: expect.stringContaining('abc-token-123'),
      }),
    );
  });

  it('sends from configured SMTP_FROM address', async () => {
    await service.sendPasswordReset('user@example.com', 'tok');

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@veygo.dev' }),
    );
  });
});
