import React from 'react';

interface TooltipProps {
  text: string; 
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '' }) => {
  if (!text) return <>{children}</>;

  return (
    <div className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <div className="absolute z-50 invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-normal max-w-xs break-words text-center">
          {text}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;