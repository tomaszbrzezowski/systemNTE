import { User, City } from '../types';

export const getUserAssignedCities = (user: User | null, allCities: City[]): City[] => {
  if (!user) return [];
  
  // Administrators can see all cities
  if (user.role === 'administrator') {
    return allCities;
  }
  
  // Supervisors and organizers can only see their assigned cities
  return allCities.filter(city => user.assignedCityIds.includes(city.id));
};

export const canAssignCity = (user: User | null, cityId: string): boolean => {
  if (!user) return false;
  
  // Administrators can assign any city
  if (user.role === 'administrator') {
    return true;
  }
  
  // Supervisors and organizers can only use their assigned cities
  return user.assignedCityIds.includes(cityId);
};

export const getAssignableCities = (user: User | null, allCities: City[]): City[] => {
  if (!user) return [];
  
  // Filter cities based on user role and assignments
  return getUserAssignedCities(user, allCities);
};

export const getSupervisorOrganizers = (user: User | null, allUsers: User[]): User[] => {
  if (!user || user.role !== 'supervisor') return [];
  
  // Get organizers assigned to this supervisor
  return allUsers.filter(u => 
    u.role === 'organizator' && 
    (user.organizatorIds.includes(u.id) || u.supervisorId === user.id)
  );
};