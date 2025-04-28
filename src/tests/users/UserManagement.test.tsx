import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import UserManagementModal from '../../components/users/UserManagementModal';
import { User, City } from '../../types';

describe('UserManagement Component', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'organizator',
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: []
    }
  ];

  const mockCities: City[] = [
    {
      id: '1',
      name: 'Test City',
      voivodeship: 'Test Region'
    }
  ];

  test('renders user management modal correctly', () => {
    render(
      <AuthProvider>
        <UserManagementModal
          isOpen={true}
          onClose={() => {}}
          users={mockUsers}
          cities={mockCities}
          onAddUser={() => {}}
          onUpdateUser={() => {}}
        />
      </AuthProvider>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('handles user role changes correctly', () => {
    const onUpdateUser = vi.fn();

    render(
      <AuthProvider>
        <UserManagementModal
          isOpen={true}
          onClose={() => {}}
          users={mockUsers}
          cities={mockCities}
          onAddUser={() => {}}
          onUpdateUser={onUpdateUser}
        />
      </AuthProvider>
    );

    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'supervisor' } });

    expect(onUpdateUser).toHaveBeenCalledWith('1', { role: 'supervisor' });
  });
});