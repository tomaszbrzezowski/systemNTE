import React from 'react';
import { X } from 'lucide-react';

interface SeatComponentProps {
  seatNumber: number;
  isRemoved: boolean;
  onRemoveSeat?: () => void;
  onRestoreSeat?: () => void;
}

/**
 * Component that represents a single seat in the hall layout
 */
const SeatComponent: React.FC<SeatComponentProps> = ({
  seatNumber,
  isRemoved,
  onRemoveSeat,
  onRestoreSeat
}) => {
  // If seat is removed, render empty space with restore button
  if (isRemoved) {
    return (
      <div className="w-6 h-6 relative group">
        {onRestoreSeat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestoreSeat();
            }}
            className="absolute inset-0 bg-green-100 border border-green-300 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Przywróć miejsce"
          >
            <span className="text-green-700 font-bold">+</span>
          </button>
        )}
      </div>
    );
  }

  // Render normal seat
  return (
    <div 
      className="relative w-6 h-6 rounded flex items-center justify-center group hover:bg-blue-200 transition-colors"
    >
      <span className="text-[12px] text-gray-700">
        {seatNumber}
      </span>
      {onRemoveSeat && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSeat();
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
};

export default SeatComponent; 