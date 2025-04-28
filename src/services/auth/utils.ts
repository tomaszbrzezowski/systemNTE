import { User } from '../../types';

export function mapUserData(data: any): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    active: data.active,
    createdAt: new Date(data.created_at),
    assignedCityIds: data.assigned_city_ids || [],
    organizatorIds: data.organizer_ids || [],
    supervisorId: data.supervisor_id || undefined
  };
}