import React from 'react';
import TransferRequestNotification from './TransferRequestNotification';
import TransferInitialNotification from './TransferInitialNotification';
import BulkSmsForm from './BulkSmsForm';
import { markNotificationAsSeen } from '../../utils/notificationStorage';
import { CalendarEvent, User } from '../../types';

interface NotificationManagerProps {
  pendingTransfers: CalendarEvent[];
  currentTransfer: CalendarEvent | null;
  users: User[];
  currentUser: User | null;
  showNotification: boolean;
  onClose: () => void;
  onViewTransfers: () => void;
  onAccept: (event: CalendarEvent) => void;
  onReject: (event: CalendarEvent) => void;
  showSmsForm?: boolean;
  smsRecipients?: {
    id: string;
    name: string;
    phone: string;
    phoneType: 'k' | 's';
    eventDate: string;
    title: string;
    eventCity: string;
    tickets: string;
  }[];
  onCloseSmsForm?: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  pendingTransfers,
  currentTransfer,
  users,
  currentUser,
  showNotification,
  onClose,
  onViewTransfers,
  onAccept,
  onReject,
  showSmsForm = false,
  smsRecipients = [],
  onCloseSmsForm = () => {},
}) => {
  const handleClose = () => {
    // Mark all current notifications as seen when closing
    validTransfers.forEach(event => {
      markNotificationAsSeen(event.id);
    });
    onClose();
  };

  // Filter out events that are no longer in the correct status
  const validTransfers = pendingTransfers.filter(event => 
    event.status === 'do_przejęcia' || 
    event.status === 'przekazywany'
  ).filter(event => event.status !== 'przekazany');

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${showNotification ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 pointer-events-auto"
           style={{ opacity: showNotification ? 1 : 0 }}>
        {currentTransfer && (
          <div className="flex items-center justify-center h-full">
            <div className="w-[480px] transform transition-all duration-200"
                 style={{ 
                   transform: showNotification ? 'scale(1)' : 'scale(0.95)',
                   opacity: showNotification ? 1 : 0 
                 }}>
              <TransferInitialNotification
                isOpen={showNotification}
                onClose={handleClose}
                onAccept={() => onAccept(currentTransfer)}
                onReject={() => onReject(currentTransfer)}
                event={currentTransfer}
                fromUser={users.find(u => u.id === currentTransfer.userId)!}
              />
            </div>
          </div>
        )}
      </div>
      
      {showSmsForm && smsRecipients.length > 0 && (
        <BulkSmsForm
          recipients={smsRecipients}
          onClose={onCloseSmsForm}
        />
      )}
    </div>
  );
};

export default NotificationManager;