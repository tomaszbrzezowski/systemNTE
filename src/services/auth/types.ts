import { User, UserRole } from '../../types';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}