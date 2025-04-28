import { CalendarEvent } from '../types';
import { EVENT_STATUSES } from './statusConstants';

export type SortField = 'status' | 'date' | 'user' | 'city' | 'calendar';
export type SortDirection = 'asc' | 'desc';

// Priority order for statuses (wydany first)
const statusPriority: { [key: string]: number } = {
  'wydany': 0,
  'w_trakcie': 1,
  'zrobiony': 2,
  'do_przekazania': 3,
  'przekazywany': 4,
  'do_przejęcia': 5,
  'wolne': 6,
  'niewydany': 7
};

export const sortEvents = (
  events: { calendar: { name: string }, event: CalendarEvent }[],
  sortField: SortField,
  sortDirection: SortDirection
) => {
  return [...events].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'status':
        const priorityA = statusPriority[a.event.status];
        const priorityB = statusPriority[b.event.status];
        if (priorityA !== priorityB) {
          return multiplier * (priorityA - priorityB);
        }
        // If statuses have same priority, sort by date
        return a.event.date.getTime() - b.event.date.getTime();

      case 'date':
        return multiplier * (a.event.date.getTime() - b.event.date.getTime());

      case 'calendar':
        return multiplier * a.calendar.name.localeCompare(b.calendar.name);

      default:
        return 0;
    }
  });
};