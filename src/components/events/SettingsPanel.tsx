import React, { useState, useEffect } from 'react';
import { X, Trash2, LayoutGrid, ArrowRight, ArrowDown, AlignLeft, AlignCenter, AlignRight, PlusSquare, MinusSquare } from 'lucide-react';
import { SeatBlock } from './HallLayout';

interface SettingsPanelProps {
  block: SeatBlock;
  onUpdate: (block: SeatBlock) => void;
  onDelete: (blockId: string) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  block,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState<SeatBlock>({ ...block });

  // Update form data when block changes
  useEffect(() => {
    setFormData({ ...block });
  }, [block]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (['x', 'y', 'width', 'height'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else if (['rows', 'seatsPerRow'].includes(name)) {
      // Handle rows and seatsPerRow as numbers
      setFormData({
        ...formData,
        [name]: Math.max(1, Math.min(100, parseInt(value) || 0))
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleColorChange = (color: string) => {
    setFormData({
      ...formData,
      color
    });
  };

  // Predefined colors
  const colors = [
    'hsl(0, 70%, 45%)',    // Red
    'hsl(30, 70%, 45%)',   // Orange
    'hsl(60, 70%, 45%)',   // Yellow
    'hsl(120, 70%, 45%)',  // Green
    'hsl(180, 70%, 45%)',  // Teal
    'hsl(210, 70%, 45%)',  // Blue
    'hsl(240, 70%, 45%)',  // Indigo
    'hsl(270, 70%, 45%)',  // Purple
    'hsl(300, 70%, 45%)',  // Pink
    'hsl(330, 70%, 45%)',  // Rose
  ];

  return (
    <div className="w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-5 flex flex-col max-h-[calc(100vh-220px)] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Block Settings</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X Position
            </label>
            <input
              type="number"
              name="x"
              value={formData.x}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="0"
              max="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Y Position
            </label>
            <input
              type="number"
              name="y"
              value={formData.y}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="0"
              max="120"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="1"
              max="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="1"
              max="120"
            />
          </div>
        </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rows
          </label>
          <input
            type="number"
            name="rows"
            value={formData.rows || 5}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            min="1"
            max="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seats Per Row
          </label>
          <input
            type="number"
            name="seatsPerRow"
            value={formData.seatsPerRow || 10}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            min="1"
            max="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seat Direction
          </label>
          <select
            name="seatDirection"
            value={formData.seatDirection || 'ltr'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="ltr">Left to Right</option>
            <option value="rtl">Right to Left</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Row Label Style
          </label>
          <select
            name="rowLabelStyle"
            value={formData.rowLabelStyle || 'arabic'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="arabic">Arabic (1, 2, 3)</option>
            <option value="roman">Roman (I, II, III)</option>
            <option value="letters">Letters (A, B, C)</option>
          </select>
        </div>
      </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orientation
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, orientation: 'horizontal' })}
              className={`flex-1 flex items-center justify-center space-x-1 p-2 rounded-lg border ${
                formData.orientation === 'horizontal' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, orientation: 'vertical' })}
              className={`flex-1 flex items-center justify-center space-x-1 p-2 rounded-lg border ${
                formData.orientation === 'vertical' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              <span>Vertical</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color, index) => (
              <button
                key={index}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-900' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zarządzanie miejscami
        </label>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Miejsca w rzędzie:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, seatsPerRow: Math.max(1, (formData.seatsPerRow || 10) - 1) })}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Usuń miejsce z rzędu"
              >
                <MinusSquare className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-900 w-8 text-center">
                {formData.seatsPerRow || 10}
              </span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, seatsPerRow: Math.min(100, (formData.seatsPerRow || 10) + 1) })}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Dodaj miejsce do rzędu"
              >
                <PlusSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

        <div className="pt-4 border-t border-gray-200 mt-4">
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Block</span>
          </button>
        </div>
      </form>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;