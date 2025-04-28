import { User } from '../../types';
import { db } from '../../lib/db';

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const storage = db.getStorage();
  const user = storage.users.get(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = {
    ...user,
    ...updates
  };

  storage.users.set(userId, updatedUser);
  return updatedUser;
};