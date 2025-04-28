import { CalendarEvent, User } from './index';

export interface NotificationState {
  notifications: CalendarEvent[];
  currentNotification: CalendarEvent | null;
  showNotification: boolean;
  notificationCount: number;
}

export interface NotificationActions {
  dismissNotification: () => void;
  refreshNotifications: () => Promise<void>;
}

export interface NotificationHandlers {
  onAccept: (event: CalendarEvent) => void;
  onReject: (event: CalendarEvent) => void;
  onViewTransfers: () => void;
  onClose: () => void;
}

export interface NotificationContext {
  pendingTransfers: CalendarEvent[];
  currentTransfer: CalendarEvent | null;
  users: User[];
  currentUser: User | null;
}