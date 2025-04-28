import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { User } from '../../types';

describe('AuthContext', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'administrator',
    active: true,
    createdAt: new Date(),
    assignedCityIds: [],
    organizatorIds: []
  };

  test('provides authentication context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(typeof result.current.setCurrentUser).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  test('handles user login and logout', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    result.current.setCurrentUser(mockUser);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    result.current.logout();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});