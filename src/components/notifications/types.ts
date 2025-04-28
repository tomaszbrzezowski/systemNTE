import { CalendarEvent, User } from '../types';

export interface BaseNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TransferNotificationProps extends BaseNotificationProps {
  event: CalendarEvent;
  fromUser: User;
  onAccept: () => void;
  onReject: () => void;
}

export interface NotificationPosition {
  position: 'top-right' | 'bottom-right' | 'center';
  animation: string;
}