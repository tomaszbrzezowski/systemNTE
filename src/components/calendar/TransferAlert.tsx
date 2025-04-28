import React from 'react';
import { CalendarEvent, User } from '../../types';

interface TransferAlertProps {
  isOpen: boolean;
  pendingTransfers: CalendarEvent[];
  users: User[];
  currentUser: User | null;
  onViewTransfers: () => void;
  onClose: () => void;
}

const TransferAlert: React.FC<TransferAlertProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  return null; // Transfer functionality has been removed
};

export default TransferAlert;