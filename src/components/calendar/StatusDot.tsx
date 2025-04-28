import React from 'react';
import { EventStatus } from '../../types';
import { EVENT_STATUSES } from '../../utils/statusConstants';

interface StatusDotProps {
  status: EventStatus;
  className?: string;
  animate?: boolean;
  size?: 'sm' | 'md';
}

const StatusDot: React.FC<StatusDotProps> = ({ 
  status, 
  className = '', 
  animate = false,
  size = 'md'
}) => {
  const statusInfo = EVENT_STATUSES[status];
  if (!statusInfo) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5'
  };

  return (
    <span 
      className={`tooltip inline-block rounded-full ${statusInfo.color} ${
        animate ? 'animate-pulse' : ''
      } ${sizeClasses[size]} ${className}`}
      data-tip={statusInfo.description}
    />
  );
};

export default StatusDot;