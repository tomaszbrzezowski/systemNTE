import React from 'react';
import { CalendarEvent, User } from '../../types';

interface LoginTransferAlertProps {
  pendingTransfers: CalendarEvent[];
  users: User[];
  currentUser: User | null;
  onViewTransfers: () => void;
  onClose: () => void;
}

const LoginTransferAlert: React.FC<LoginTransferAlertProps> = ({
  onClose
}) => {
  return null; // Transfer functionality has been removed
};

export default LoginTransferAlert;