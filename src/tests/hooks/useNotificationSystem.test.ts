import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationSystem } from '../../hooks/useNotificationSystem';
import { checkPendingTransfers } from '../../services/calendar';
import { User } from '../../types';

vi.mock('../../services/calendar', () => ({
  checkPendingTransfers: vi.fn()
}));

describe('useNotificationSystem', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'organizator',
    active: true,
    createdAt: new Date(),
    assignedCityIds: [],
    organizatorIds: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initializes with empty notifications', () => {
    (checkPendingTransfers as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useNotificationSystem(mockUser));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.currentNotification).toBeNull();
    expect(result.current.showNotification).toBe(false);
    expect(result.current.notificationCount).toBe(0);
  });
});