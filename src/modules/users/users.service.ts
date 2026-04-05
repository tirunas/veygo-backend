import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserRecord, PublicUser } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByIdOrThrow(id: string): Promise<UserRecord> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmailOrNull(email: string): Promise<UserRecord | null> {
    return this.usersRepository.findByEmail(email);
  }

  async assertEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
  }

  toPublicUser(user: UserRecord): PublicUser {
    const { passwordHash, loginAttempts, lockedUntil, ...publicFields } = user;
    void passwordHash;
    void loginAttempts;
    void lockedUntil;
    return publicFields;
  }
}
