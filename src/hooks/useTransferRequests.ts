import { useState, useEffect } from 'react';
import { User, CalendarEvent } from '../types';

export const useTransferRequests = (currentUser: User | null) => {
  return { pendingTransfers: [] };
};