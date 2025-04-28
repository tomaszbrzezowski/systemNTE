import { useState } from 'react';
import { User } from '../types';

export const useTransferAlerts = (currentUser: User | null) => {
  const [showAlert, setShowAlert] = useState(false);

  return {
    pendingTransfers: [],
    showAlert,
    setShowAlert,
    refreshTransfers: async () => {
      // Transfer functionality has been removed
      return;
    }
  };
};