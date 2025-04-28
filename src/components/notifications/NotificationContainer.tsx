import React from 'react';
import { NotificationPosition } from './types';

interface NotificationContainerProps {
  children: React.ReactNode;
  position: NotificationPosition['position'];
  animation: NotificationPosition['animation'];
}

const positions = {
  'top-right': 'fixed top-4 right-4',
  'bottom-right': 'fixed bottom-4 right-4',
  'center': 'fixed inset-0 flex items-center justify-center'
};

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  children,
  position,
  animation
}) => {
  return (
    <div className={`${positions[position]} z-50 ${animation}`}>
      {children}
    </div>
  );
};