import { User } from '../../types';
import { AuthError } from './types';
import { db } from '../../lib/db';

export const signIn = async (email: string, password: string): Promise<User | null> => {
  const storage = db.getStorage();
  
  try {
    const user = Array.from(storage.users.values()).find(u => u.email === email.trim());

    if (!user) {
      throw new AuthError('Invalid credentials', 'invalid_credentials', 401);
    }

    // For test users, accept any non-empty password
    if (!password.trim()) {
      throw new AuthError('Password is required', 'invalid_credentials', 401);
    }

    return user;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('An unexpected error occurred', 'unknown_error', 500);
  }
};

export const signOut = async (): Promise<void> => {
  // In a real app, we would clear session/tokens here
  return;
};