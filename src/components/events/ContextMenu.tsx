import React, { useEffect, useRef } from 'react';
import { Trash2, Plus, Minus, Edit2, Settings } from 'lucide-react';

interface MenuOption {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: MenuOption[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - (menuRef.current?.offsetWidth || 200)),
    y: Math.min(y, window.innerHeight - (menuRef.current?.offsetHeight || 200))
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {options.map((option, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => {
              option.onClick();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
          >
            <span className="text-gray-500">{option.icon}</span>
            <span>{option.label}</span>
          </button>
          {option.divider && <div className="my-1 border-t border-gray-100" />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ContextMenu