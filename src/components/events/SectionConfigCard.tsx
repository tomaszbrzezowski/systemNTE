import React from 'react';
import { Pencil, Minus, Plus } from 'lucide-react';

interface SectionConfigCardProps {
  name: string;
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
  onToggle: () => void;
  onEdit: () => void;
  onRowsChange: (rows: number) => void;
  onSeatsChange: (seats: number) => void;
  numerationType: '1, 2, 3' | 'I, II, III' | 'A, B, C';
  onNumerationChange: (type: '1, 2, 3' | 'I, II, III' | 'A, B, C') => void;
  numberingDirection: 'Od lewej do prawej' | 'Od prawej do lewej';
  onDirectionChange: (direction: 'Od lewej do prawej' | 'Od prawej do lewej') => void;
}

const SectionConfigCard: React.FC<SectionConfigCardProps> = ({
  name,
  enabled,
  rows,
  seatsPerRow,
  onToggle,
  onEdit,
  onRowsChange,
  onSeatsChange,
  numerationType,
  onNumerationChange,
  numberingDirection,
  onDirectionChange
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          <button 
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={onToggle}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>

      <div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Rzędy:</span>
          <div className="flex items-center">
            <button 
              onClick={() => onRowsChange(Math.max(1, rows - 1))}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
              disabled={rows <= 1}
            >
              <Minus className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span className="px-3 py-1 border-t border-b border-gray-300 text-sm">{rows}</span>
            <button 
              onClick={() => onRowsChange(rows + 1)}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-r-md border border-gray-300"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Miejsca:</span>
          <div className="flex items-center">
            <button 
              onClick={() => onSeatsChange(Math.max(1, seatsPerRow - 1))}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
              disabled={seatsPerRow <= 1}
            >
              <Minus className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span className="px-3 py-1 border-t border-b border-gray-300 text-sm">{seatsPerRow}</span>
            <button 
              onClick={() => onSeatsChange(seatsPerRow + 1)}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-r-md border border-gray-300"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Numeracja:</span>
          <select 
            value={numerationType} 
            onChange={(e) => onNumerationChange(e.target.value as any)}
            className="text-xs border border-gray-300 rounded-md p-1"
          >
            <option value="1, 2, 3">1, 2, 3</option>
            <option value="I, II, III">I, II, III</option>
            <option value="A, B, C">A, B, C</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Kierunek numeracji:</span>
          <select 
            value={numberingDirection} 
            onChange={(e) => onDirectionChange(e.target.value as any)}
            className="text-xs border border-gray-300 rounded-md p-1"
          >
            <option value="Od lewej do prawej">Od lewej do prawej</option>
            <option value="Od prawej do lewej">Od prawej do lewej</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SectionConfigCard;