import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SmsStatusBadgeProps {
  status: number;
  className?: string;
}

const SmsStatusBadge: React.FC<SmsStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 0:
        return {
          icon: Clock,
          text: 'Oczekuje',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 2:
        return {
          icon: AlertCircle,
          text: 'Numer stacjonarny',
          color: 'bg-gray-100 text-gray-800'
        };
      case 3:
        return {
          icon: CheckCircle,
          text: 'Wysłano',
          color: 'bg-green-100 text-green-800'
        };
      case 11:
        return {
          icon: XCircle,
          text: 'Błąd',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Nieznany status',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const { icon: Icon, text, color } = getStatusInfo();

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color} ${className}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {text}
    </div>
  );
};

export default SmsStatusBadge;