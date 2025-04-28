export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  assignedCityIds: string[];
  supervisorId?: string;
  organizatorIds: string[];
}

export type UserRole = 'administrator' | 'supervisor' | 'organizator';

export interface City {
  id: string;
  name: string;
  voivodeship: string;
  population?: number;
  latitude: number;
  longitude: number;
}

export interface Calendar {
  id: string;
  name: string;
  rowSeats: number[];
  numberingStyle: 'arabic' | 'roman' | 'letters';
  orientation: 'horizontal' | 'vertical';
  alignment: 'left' | 'center' | 'right';
  removedSeats: { [key: number]: Set<number> };
  seatGaps: { [key: number]: Set<number> };
  emptyRows: Set<number>;
  position: { x: number; y: number };
  rotation: number;
  customRowLabels?: { [key: number]: string };
  seatLabels?: { [key: number]: { [key: number]: string } };
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  date: Date;
  userId: string | null;
  city: City | null;
  status: EventStatus;
  previousUserId: string | null;
  toUserId: string | null;
}

export type EventStatus = 
  | 'wydany'        // Issued
  | 'w_trakcie'     // In progress
  | 'zrobiony'      // Done
  | 'do_przejęcia'  // To be taken over
  | 'wolne'         // Free
  | 'niewydany'     // Not issued
  | 'przekaz'       // Transfer request
  | 'przekazany'    // Transferred
  | 'przekazywany'; // Being transferred

export interface SectionBlock {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rows: number;
  rowSeats: number[];
  removedSeats: { [key: number]: Set<number> };
  seatGaps: { [key: number]: Set<number> };
  emptyRows: Set<number>;
  orientation: 'horizontal' | 'vertical';
  numberingStyle: 'arabic' | 'roman' | 'letters';
  numberingDirection: 'ltr' | 'rtl';
  alignment: 'left' | 'center' | 'right';
  position: 'center' | 'left' | 'right' | 'back';
  rowAlignments?: { [key: number]: 'left' | 'center' | 'right' };
}