import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';
import { User } from '../../types';

describe('usePermissions Hook', () => {
  test('returns correct permissions for administrator', () => {
    const adminUser: User = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'administrator',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: []
    };

    const { result } = renderHook(() => usePermissions(adminUser));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageCalendars).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageCities).toBe(true);
  });

  test('returns correct permissions for supervisor', () => {
    const supervisorUser: User = {
      id: '2',
      name: 'Supervisor',
      email: 'supervisor@test.com',
      role: 'supervisor',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: []
    };

    const { result } = renderHook(() => usePermissions(supervisorUser));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSupervisor).toBe(true);
    expect(result.current.canViewFullDetails).toBe(true);
    expect(result.current.canEditOwnEvents).toBe(true);
  });
});