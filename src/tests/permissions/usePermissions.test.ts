import { describe, test, expect } from 'vitest';
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

    const permissions = usePermissions(adminUser);

    expect(permissions.isAdmin).toBe(true);
    expect(permissions.canManageCalendars).toBe(true);
    expect(permissions.canManageUsers).toBe(true);
    expect(permissions.canManageCities).toBe(true);
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

    const permissions = usePermissions(supervisorUser);

    expect(permissions.isAdmin).toBe(false);
    expect(permissions.isSupervisor).toBe(true);
    expect(permissions.canViewFullDetails).toBe(true);
    expect(permissions.canEditOwnEvents).toBe(true);
  });

  test('returns correct permissions for organizator', () => {
    const organizatorUser: User = {
      id: '3',
      name: 'Organizator',
      email: 'organizator@test.com',
      role: 'organizator',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: []
    };

    const permissions = usePermissions(organizatorUser);

    expect(permissions.isAdmin).toBe(false);
    expect(permissions.isOrganizator).toBe(true);
    expect(permissions.canEditOwnEvents).toBe(true);
    expect(permissions.canEditOtherEvents).toBe(false);
  });
});