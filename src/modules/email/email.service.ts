import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM') ?? 'noreply@veygo.dev';
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      secure: false,
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Veygo — password reset link',
      text: `Use this token to reset your password: ${token}\n\nExpires in 15 minutes.`,
    });
  }
}
