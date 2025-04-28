import { User } from '../types';

export const canViewUserData = (currentUser: User, targetUserId: string): boolean => {
  if (!currentUser) return false;
  
  // Administrators can see all user data
  if (currentUser.role === 'administrator') {
    return true;
  }

  // Supervisors can see their own data and their assigned organizers' data
  if (currentUser.role === 'supervisor') {
    return currentUser.id === targetUserId || 
           currentUser.organizatorIds.includes(targetUserId);
  }

  // Organizers can only see their own data
  return currentUser.id === targetUserId;
};

export const canViewFullEventDetails = (currentUser: User | null, eventUserId: string): boolean => {
  if (!currentUser) return false;
  
  // Administrators can see all details
  if (currentUser.role === 'administrator') {
    return true;
  }

  // Supervisors can see details for themselves and their assigned organizers
  if (currentUser.role === 'supervisor') {
    return currentUser.id === eventUserId || 
           currentUser.organizatorIds.includes(eventUserId);
  }

  // Organizers can only see their own details
  return currentUser.id === eventUserId;
};