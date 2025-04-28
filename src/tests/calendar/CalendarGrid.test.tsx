import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import { Calendar, User } from '../../types';

describe('CalendarGrid', () => {
  const mockCalendar: Calendar = {
    id: '1',
    name: 'Test Calendar',
    events: [],
    order: 0,
    createdBy: '1'
  };

  const mockUsers: User[] = [{
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'administrator',
    active: true,
    createdAt: new Date(),
    assignedCityIds: [],
    organizatorIds: []
  }];

  test('renders calendar grid with correct title', () => {
    render(
      <AuthProvider>
        <CalendarGrid
          calendar={mockCalendar}
          currentDate={new Date()}
          onEdit={() => {}}
          onDelete={() => {}}
          onUpdateEvent={() => {}}
          users={mockUsers}
          cities={[]}
        />
      </AuthProvider>
    );

    expect(screen.getByText('Test Calendar')).toBeInTheDocument();
  });

  test('handles event updates correctly', async () => {
    const onUpdateEvent = vi.fn();
    render(
      <AuthProvider>
        <CalendarGrid
          calendar={mockCalendar}
          currentDate={new Date()}
          onEdit={() => {}}
          onDelete={() => {}}
          onUpdateEvent={onUpdateEvent}
          users={mockUsers}
          cities={[]}
        />
      </AuthProvider>
    );

    // Click on a day to open event modal
    const days = screen.getAllByRole('button');
    fireEvent.click(days[0]);

    // Verify modal opens
    expect(screen.getByText(/edycja terminu/i)).toBeInTheDocument();
  });
});