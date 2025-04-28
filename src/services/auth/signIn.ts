import { User } from '../../types';
import { AuthError } from './types';
import { supabase } from '../../lib/supabase';
import { fetchUserProfile } from './userProfile'; 
import { validateUserStatus } from '../../utils/authValidation';

const handleAuthError = (error: any): never => {
  console.error('Authentication error:', error);

  if (!navigator.onLine) {
    throw new AuthError('Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.', 'network_error', 503);
  }

  if (error.message?.includes('Invalid Refresh Token')) {
    throw new AuthError('Sesja wygasła. Zaloguj się ponownie.', 'session_expired', 401);
  }

  if (error.message?.includes('Failed to fetch')) {
    throw new AuthError(
      'Nie można połączyć się z serwerem. Sprawdź swoje połączenie z internetem lub spróbuj ponownie później.',
      'connection_error',
      503
    );
  }

  throw new AuthError(
    error.message || 'Wystąpił błąd podczas logowania',
    error.code || 'unknown_error',
    error.status || 500
  );
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    if (!email.trim() || !password.trim()) {
      throw new AuthError('Email and password are required', 'invalid_credentials', 401);
    }

    // Check network connectivity
    if (!navigator.onLine) {
      throw new AuthError('Brak połączenia z internetem', 'network_error', 503);
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        const message = authError.message === 'Invalid login credentials'
          ? 'Nieprawidłowy email lub hasło'
          : authError.message;
        throw new AuthError(message, 'invalid_credentials', 401);
      }

      if (!authData.user) {
        throw new AuthError('Nieprawidłowe dane logowania', 'invalid_credentials', 401);
      }

      const userData = await fetchUserProfile(authData.user.id);

      // Validate user status before allowing login
      validateUserStatus(userData);

      // Store auth data in localStorage for persistence
      try {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token
        }));
      } catch (storageError) {
        console.error('Error storing auth token:', storageError);
        // Continue even if storage fails
      }

      return userData;
    } catch (error: any) {
      handleAuthError(error);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    handleAuthError(error);
  }
  return null;
};