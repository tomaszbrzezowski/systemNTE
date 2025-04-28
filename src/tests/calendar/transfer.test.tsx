import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import { Calendar, User, EventStatus } from '../../types';

describe('Calendar Transfer Functionality', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'administrator',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: [],
    },
    {
      id: '2',
      name: 'Test User',
      email: 'test@example.com',
      role: 'organizator',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: [],
    },
  ];

  test('accepting transfer updates event correctly', async () => {
    const onUpdateEvent = vi.fn();
    const calendarWithTransfer: Calendar = {
      id: '1',
      name: 'Test Calendar',
      events: [{
        id: '1',
        date: new Date(),
        userId: '2',
        city: null,
        status: 'przekazywany' as EventStatus,
        transfer: {
          fromUserId: '2',
          toUserId: '1',
        },
      }],
    };

    render(
      <AuthProvider>
        <CalendarGrid
          calendar={calendarWithTransfer}
          currentDate={new Date()}
          onEdit={() => {}}
          onDelete={() => {}}
          onUpdateEvent={onUpdateEvent}
          users={mockUsers}
        />
      </AuthProvider>
    );

    // Accept transfer
    const acceptButton = screen.getByRole('button', { name: /Przyjmij termin/i });
    fireEvent.click(acceptButton);

    expect(onUpdateEvent).toHaveBeenCalledWith(
      calendarWithTransfer.id,
      expect.any(Array),
      expect.objectContaining({
        status: 'wydany',
        userId: '1',
        previousUserId: '2',
        transfer: expect.objectContaining({
          accepted: true,
        }),
      })
    );
  });
});