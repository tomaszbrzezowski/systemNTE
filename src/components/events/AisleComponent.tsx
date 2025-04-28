import React from 'react';
import { Minus } from 'lucide-react';

interface AisleComponentProps {
  section: string;
  rowIndex: number;
  onRemoveAisle?: (section: string, rowIndex: number) => void;
}

/**
 * Component that represents an aisle (empty row) in the hall layout
 */
const AisleComponent: React.FC<AisleComponentProps> = ({
  section,
  rowIndex,
  onRemoveAisle
}) => {
  return (
    <div className="flex items-center justify-center min-w-max">
      <div className="w-16 text-right pr-4 text-gray-400">
        —
      </div>
      <div className="flex gap-1 justify-center flex-nowrap h-6">
        {/* Empty space for aisle */}
        <div className="w-full h-6 border-t border-b border-gray-300 border-dashed flex items-center justify-center min-w-[300px]">
          <div className="relative group">
            <span className="text-xs text-gray-400 cursor-pointer">Przejście</span>
            {onRemoveAisle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAisle(section, rowIndex);
                }}
                className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                title="Usuń przejście"
              >
                <Minus className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="w-16 text-left pl-4 text-gray-400">
        —
      </div>
    </div>
  );
};

export default AisleComponent; 