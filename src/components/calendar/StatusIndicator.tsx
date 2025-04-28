import React from 'react';
import { User } from '../../types';
import { formatShortName } from '../../utils/userNameUtils';

interface StatusIndicatorProps {
  userId: string;
  users: User[];
  currentUser: User | null;
  shouldBlink?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  userId,
  users,
  currentUser,
  shouldBlink = false
}) => {
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const isCurrentUser = currentUser?.id === userId;
  const isSupervisorAssigned = currentUser?.role === 'supervisor' && 
    currentUser.organizatorIds.includes(userId);

  const displayName = formatShortName(user.name);
  const fullName = user.name;

  // Always make text bold for current user's events
  const nameClassName = [
    'text-xs truncate',
    isCurrentUser ? 'font-bold' : '',
    isSupervisorAssigned ? 'font-bold text-blue-900' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`status-dot bg-red-500 ${shouldBlink ? 'animate-pulse' : ''}`}
      />
      <span 
        className={nameClassName}
        title={fullName}
      >
        {displayName}
      </span>
    </div>
  );
};

export default StatusIndicator;