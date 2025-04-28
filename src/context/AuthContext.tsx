import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { AuthError } from '../services/auth/types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const handleLogoutError = (error: any) => {
  if (error.message?.includes('refresh_token_not_found')) {
    // Session already expired, just clear the local state and show a message
    toast.error('Sesja wygasła. Proszę zalogować się ponownie.');
    return;
  }
  throw new AuthError(
    'Wystąpił błąd podczas wylogowywania',
    'logout_error',
    500
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  };

  const logout = useCallback(async () => {
    try {
      // Clear all local storage data
      for (const key in localStorage) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleLogoutError(error);
      }
      handleSetCurrentUser(null);
      window.location.href = '/';
    } catch (error) {
      handleLogoutError(error);
    }
  }, []);

  const value = {
    currentUser,
    setCurrentUser: handleSetCurrentUser,
    isAuthenticated,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};