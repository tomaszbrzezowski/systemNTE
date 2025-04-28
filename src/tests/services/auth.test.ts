import { describe, test, expect, vi } from 'vitest';
import { signIn, signOut } from '../../services/auth';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Auth Service', () => {
  test('signIn successfully authenticates user', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'administrator',
      active: true,
      created_at: new Date().toISOString(),
      assigned_city_ids: [],
      organizer_ids: [],
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    });

    (supabase.from as any)().select().eq().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    const user = await signIn('test@example.com', 'password');

    expect(user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'administrator',
      active: true,
      createdAt: expect.any(Date),
      assignedCityIds: [],
      organizatorIds: [],
      supervisorId: undefined,
    });
  });

  test('signIn throws error on authentication failure', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid credentials'),
    });

    await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
  });

  test('signOut successfully logs out user', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    await expect(signOut()).resolves.not.toThrow();
  });
});