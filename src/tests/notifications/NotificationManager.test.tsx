import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationManager from '../../components/notifications/NotificationManager';
import { CalendarEvent, User } from '../../types';

describe('NotificationManager', () => {
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

  const mockEvent: CalendarEvent = {
    id: '1',
    calendarId: '1',
    date: new Date(),
    userId: '2',
    city: null,
    status: 'przekazywany',
    previousUserId: '2',
    toUserId: '1'
  };

  test('renders notifications when there are pending transfers', () => {
    render(
      <NotificationManager
        pendingTransfers={[mockEvent]}
        currentTransfer={mockEvent}
        users={[mockUser]}
        currentUser={mockUser}
        showNotification={true}
        onClose={() => {}}
        onViewTransfers={() => {}}
        onAccept={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.getByText(/nowa prośba/i)).toBeInTheDocument();
  });

  test('does not render notifications when there are no pending transfers', () => {
    render(
      <NotificationManager
        pendingTransfers={[]}
        currentTransfer={null}
        users={[mockUser]}
        currentUser={mockUser}
        showNotification={false}
        onClose={() => {}}
        onViewTransfers={() => {}}
        onAccept={() => {}}
        onReject={() => {}}
      />
    );

    expect(screen.queryByText(/nowa prośba/i)).not.toBeInTheDocument();
  });
});