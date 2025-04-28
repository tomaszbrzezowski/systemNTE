import { EventStatus } from '../types';

export const EVENT_STATUSES: Record<EventStatus, {
  value: EventStatus;
  label: string;
  color: string;
  description: string;
  requiresUserSelection?: boolean;
  showPreviousUser?: boolean;
  requiresUserAssignment?: boolean;
}> = {
  wydany: {
    value: 'wydany',
    label: 'Wydany',
    color: 'bg-red-500',
    description: 'Termin został wydany użytkownikowi'
  },
  przekaz: {
    value: 'przekaz',
    label: 'Przekaż',
    color: 'bg-yellow-500',
    description: 'Przekaż termin innemu użytkownikowi',
    requiresUserSelection: true
  },
  w_trakcie: {
    value: 'w_trakcie',
    label: 'W trakcie',
    color: 'bg-blue-500',
    description: 'Zadanie jest w trakcie realizacji'
  },
  zrobiony: {
    value: 'zrobiony',
    label: 'Zrobiony',
    color: 'bg-green-500',
    description: 'Zadanie zostało wykonane'
  },
  do_przejęcia: {
    value: 'do_przejęcia',
    label: 'Do przejęcia',
    color: 'bg-purple-500',
    description: 'Termin jest dostępny do przejęcia',
    showPreviousUser: true
  },
  wolne: {
    value: 'wolne',
    label: 'Wolne',
    color: 'bg-gray-500',
    description: 'Termin jest wolny'
  },
  niewydany: {
    value: 'niewydany',
    label: 'Niewydany',
    color: 'bg-gray-300',
    description: 'Termin nie został jeszcze wydany'
  },
  przekazany: {
    value: 'przekazany',
    label: 'Przekazany',
    color: 'bg-yellow-500',
    description: 'Termin został przekazany innemu użytkownikowi'
  },
  przekazywany: {
    value: 'przekazywany',
    label: 'Przekazywany',
    color: 'bg-black',
    description: 'Termin jest w trakcie przekazywania'
  }
};

export const getStatusInfo = (status: EventStatus) => {
  return EVENT_STATUSES[status] || {
    value: status,
    label: status,
    color: 'bg-gray-300',
    description: 'Unknown status'
  };
};