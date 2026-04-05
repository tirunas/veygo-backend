import { Injectable, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HasherService {
  private readonly rounds: number;

  constructor(@Optional() configOrRounds?: ConfigService | number) {
    if (typeof configOrRounds === 'number') {
      this.rounds = configOrRounds;
    } else if (configOrRounds instanceof ConfigService) {
      this.rounds = configOrRounds.get<number>('BCRYPT_ROUNDS') ?? 12;
    } else {
      this.rounds = 12;
    }
  }

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.rounds);
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
