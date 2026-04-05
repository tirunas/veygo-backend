import { Role } from '@prisma/client';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  loginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<
  UserRecord,
  'passwordHash' | 'loginAttempts' | 'lockedUntil'
>;
