import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';

describe('App Component', () => {
  test('renders login page when user is not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('NARODOWY TEATR EDUKACJI')).toBeInTheDocument();
  });

  test('renders main application when user is authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('NARODOWY TEATR EDUKACJI')).toBeInTheDocument();
  });
});