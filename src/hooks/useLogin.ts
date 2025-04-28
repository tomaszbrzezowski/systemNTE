import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signIn, AuthError } from '../services/auth';

interface UseLoginReturn {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  selectedApp: 'calendar' | 'events' | null;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  setSelectedApp: (app: 'calendar' | 'events') => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<'calendar' | 'events' | null>(null);
  
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) {
      setError('Wybierz aplikację przed zalogowaniem');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      setError('Wprowadź email i hasło');
      setLoading(false);
      return;
    }

    try {
      const user = await signIn(trimmedEmail, trimmedPassword);
      if (user) {
        setCurrentUser(user);
        if (selectedApp === 'events' && user.role !== 'administrator') {
          setError('Brak dostępu do systemu wydarzeń');
          setCurrentUser(null);
          return;
        }
        navigate(selectedApp === 'calendar' ? '/' : '/events');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof AuthError && err.code === 'invalid_credentials') {
        setError('Nieprawidłowe dane logowania. Sprawdź email i hasło.');
      } else if (err instanceof AuthError && err.code === 'account_deactivated') {
        setError('Konto zostało dezaktywowane. Skontaktuj się z administratorem.');
      } else if (err instanceof AuthError && err.code === 'email_not_confirmed') {
        setError('Konto nie zostało aktywowane. Sprawdź swoją skrzynkę email.');
      } else if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    password,
    showPassword,
    error,
    loading,
    selectedApp,
    setEmail,
    setPassword,
    setShowPassword,
    setSelectedApp,
    handleSubmit,
  };
}; 