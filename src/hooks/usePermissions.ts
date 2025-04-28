import { User } from '../types';
import { canEditEvent } from '../utils/statusPermissions';

export const usePermissions = (currentUser: User | null) => {
  const isAdmin = currentUser?.role === 'administrator';
  const isSupervisor = currentUser?.role === 'supervisor';
  const isOrganizator = currentUser?.role === 'organizator';

  const checkEditPermission = (status?: string, eventUserId?: string | null) => {
    if (!currentUser) return false;
    // Administrators can edit everything
    if (isAdmin) return true;
    return canEditEvent(currentUser, status, eventUserId);
  };

  return {
    isAdmin,
    isSupervisor,
    isOrganizator,
    canEditEvent: checkEditPermission,
    canManageCalendars: isAdmin,
    canManageUsers: isAdmin,
    canManageCities: isAdmin,
    canViewFullDetails: isAdmin || isSupervisor,
    canEditOwnEvents: isAdmin || isSupervisor || isOrganizator,
    canEditOtherEvents: isAdmin,
    canAssignCities: isAdmin,
    canChangeStatus: isAdmin || isSupervisor || isOrganizator,
    allowedStatuses: isAdmin 
      ? ['wydany', 'zrobiony', 'do_przekazania', 'przekazywany', 'do_przejęcia', 'w_trakcie', 'wolne', 'niewydany']
      : ['wydany', 'w_trakcie', 'do_przejęcia']
  };
};