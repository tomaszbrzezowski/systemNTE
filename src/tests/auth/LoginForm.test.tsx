import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import LoginForm from '../../components/auth/LoginForm';

describe('LoginForm', () => {
  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login form correctly', () => {
    renderLoginForm();

    expect(screen.getByText('NARODOWY TEATR EDUKACJI')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    renderLoginForm();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /zaloguj się/i }));

    await waitFor(() => {
      expect(screen.queryByText(/nieprawidłowe dane/i)).not.toBeInTheDocument();
    });
  });

  test('displays error on invalid credentials', async () => {
    renderLoginForm();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: /zaloguj się/i }));

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowe dane logowania/i)).toBeInTheDocument();
    });
  });
});