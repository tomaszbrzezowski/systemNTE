import { describe, test, expect } from 'vitest';
import { getEventDisplayInfo } from '../../utils/calendar/displayUtils';
import { User, CalendarEvent } from '../../types';

describe('displayUtils', () => {
  const mockOrganizer: User = {
    id: '1',
    name: 'Test Organizer',
    email: 'organizer@test.com',
    role: 'organizator',
    active: true,
    createdAt: new Date(),
    assignedCityIds: [],
    organizatorIds: [],
    supervisorId: '2'
  };

  const mockSupervisor: User = {
    id: '2',
    name: 'Test Supervisor',
    email: 'supervisor@test.com',
    role: 'supervisor',
    active: true,
    createdAt: new Date(),
    assignedCityIds: [],
    organizatorIds: ['1']
  };

  const mockEvent: CalendarEvent = {
    id: '1',
    calendarId: '1',
    date: new Date(),
    userId: '1',
    city: null,
    status: 'wydany',
    previousUserId: null,
    toUserId: null
  };

  test('displays organizer in blue when viewed by their supervisor', () => {
    const result = getEventDisplayInfo(mockEvent, [mockOrganizer, mockSupervisor], mockSupervisor);
    expect(result.isSupervisorOrganizer).toBe(true);
    expect(result.displayStyle).toBe('font-bold text-blue-600');
  });

  test('displays own events in bold', () => {
    const result = getEventDisplayInfo(mockEvent, [mockOrganizer, mockSupervisor], mockOrganizer);
    expect(result.isCurrentUser).toBe(true);
    expect(result.displayStyle).toBe('font-bold text-gray-900');
  });
});