import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  Icon: LucideIcon;
  onClick: () => void;
  label: string;
  className?: string;
  badge?: number;
  animation?: 'pulse' | 'bounce';
}

const IconButton: React.FC<IconButtonProps> = ({
  Icon,
  onClick,
  label,
  className = '',
  badge,
  animation
}) => {
  const animationClass = animation === 'pulse' ? 'menu-button-pulse' : 
                        animation === 'bounce' ? 'menu-button-bounce' : '';

  return (
    <button 
      onClick={onClick}
      className={`menu-button group relative ${animationClass} ${className}`}
    >
      <Icon className="w-5 h-5" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
};

export default IconButton;