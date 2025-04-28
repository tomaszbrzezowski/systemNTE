import { User } from '../types';
import { AuthError } from '../services/auth/types';

export const validateUserStatus = (user: User): void => {
  if (!user.active) {
    throw new AuthError(
      'Twoje konto zostało dezaktywowane. Skontaktuj się z administratorem.',
      'account_deactivated',
      403
    );
  }
};