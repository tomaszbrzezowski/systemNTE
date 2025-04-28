import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, LayoutGrid, ArrowRight, ArrowDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (section: {
    name: 'PARTER' | 'BALKON I' | 'BALKON II' | 'BALKON III' | 
          'BALKON PRAWY I' | 'BALKON PRAWY II' | 'BALKON PRAWY III' |
          'BALKON LEWY I' | 'BALKON LEWY II' | 'BALKON LEWY III';
    rows: number;
    rowSeats: number[];
    removedSeats: { [key: number]: Set<number> };
    emptyRows: Set<number>;
    orientation: 'horizontal' | 'vertical';
    numberingStyle: 'arabic' | 'roman' | 'letters';
    numberingDirection: 'ltr' | 'rtl';
    alignment: 'left' | 'center' | 'right';
    position: 'center' | 'left' | 'right' | 'back';
   rowAlignments?: { [key: number]: 'left' | 'center' | 'right' };
  }) => void;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    name: 'PARTER' as const,
    rows: 5,
    seatsPerRow: 10, // Temporary state for UI
    orientation: 'horizontal' as const,
    numberingStyle: 'arabic' as const,
    numberingDirection: 'ltr' as const, // Default left-to-right
    alignment: 'center' as const,
    position: 'center' as const
  });

  // Update position when name changes
  useEffect(() => {
    // Determine position based on section name
    let position: 'center' | 'left' | 'right' | 'back' = 'center';
    
    if (formData.name === 'PARTER') {
      position = 'center';
    } else if (formData.name.includes('LEWY')) {
      position = 'left';
    } else if (formData.name.includes('PRAWY')) {
      position = 'right';
    } else if (formData.name.includes('BALKON')) {
      position = 'back';
    }
    
    if (position !== formData.position) {
      setFormData(prev => ({ ...prev, position }));
    }
  }, [formData.name]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert seatsPerRow to rowSeats array
    const section = {
      ...formData,
      rowSeats: Array(formData.rows).fill(formData.seatsPerRow),
      removedSeats: {},
      emptyRows: new Set<number>(),
      alignment: formData.alignment,
     rowAlignments: {},
      position: formData.name.toLowerCase() === 'parter' ? 'center' : formData.position
    };
    delete (section as any).seatsPerRow;
    onAdd(section);
    onClose();
  };

  // Preview rendering
  const renderPreview = () => {
    const { orientation, alignment, rows, seatsPerRow } = formData;
    
    if (orientation === 'horizontal') {
      return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center">
            {Array.from({ length: Math.min(rows, 5) }).map((_, rowIndex) => {
              const rowSeats = Array.from({ length: Math.min(seatsPerRow, 15) });
              
              // Calculate alignment offset
              let alignmentClass = '';
              switch (alignment) {
                case 'left': alignmentClass = 'justify-start'; break;
                case 'center': alignmentClass = 'justify-center'; break;
                case 'right': alignmentClass = 'justify-end'; break;
              }
              
              return (
                <div key={rowIndex} className={`flex ${alignmentClass} w-full my-1`}>
                  {rowSeats.map((_, seatIndex) => (
                    <div 
                      key={seatIndex}
                      className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm mx-0.5"
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Vertical orientation
      return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex justify-center">
            {Array.from({ length: Math.min(seatsPerRow, 10) }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col mx-0.5">
                {Array.from({ length: Math.min(rows, 5) }).map((_, rowIndex) => (
                  <div 
                    key={rowIndex}
                    className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm my-0.5"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // Convert number to Roman numeral
  const toRoman = (num: number): string => {
    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    let remaining = num;
    
    for (const { value, numeral } of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }
    
    return result;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-xl mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Dodaj nową sekcję</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section details */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Szczegóły sekcji</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wybierz sekcję
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: e.target.value as typeof formData.name,
                    position: e.target.value === 'PARTER' ? 'center' : 
                             e.target.value.includes('LEWY') ? 'left' :
                             e.target.value.includes('PRAWY') ? 'right' : 'back'
                  })}
                  className="modal-input"
                  required
                >
                  <option value="PARTER">PARTER</option>
                  <option value="BALKON I">BALKON I</option>
                  <option value="BALKON II">BALKON II</option>
                  <option value="BALKON III">BALKON III</option>
                  <option value="BALKON PRAWY I">BALKON PRAWY I</option>
                  <option value="BALKON PRAWY II">BALKON PRAWY II</option>
                  <option value="BALKON PRAWY III">BALKON PRAWY III</option>
                  <option value="BALKON LEWY I">BALKON LEWY I</option>
                  <option value="BALKON LEWY II">BALKON LEWY II</option>
                  <option value="BALKON LEWY III">BALKON LEWY III</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pozycja sekcji
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: e.target.value as typeof formData.position
                  })}
                  className="modal-select"
                >
                  <option value="center">Środek</option>
                  <option value="left">Lewa strona</option>
                  <option value="right">Prawa strona</option>
                  <option value="back">Tył</option>
                </select>
              </div>
            </div>
          </div>

          {/* Size configuration */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Rozmiar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liczba rzędów
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rows: Math.max(1, formData.rows - 1) })}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded-l-md"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) })}
                    className="text-center w-16 border-y border-gray-300 py-1.5"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rows: formData.rows + 1 })}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded-r-md"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miejsc w rzędzie
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, seatsPerRow: Math.max(1, formData.seatsPerRow - 1) })}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded-l-md"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.seatsPerRow}
                    onChange={(e) => setFormData({ ...formData, seatsPerRow: parseInt(e.target.value) })}
                    className="text-center w-16 border-y border-gray-300 py-1.5"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, seatsPerRow: formData.seatsPerRow + 1 })}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded-r-md"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Style configuration */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Styl i układ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orientacja
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
                    <span>Pozioma</span>
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
                    <span>Pionowa</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kierunek numeracji
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs text-gray-500 mb-1">Wybierz kierunek numeracji miejsc w rzędach</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, numberingDirection: 'ltr' })}
                      className={`flex items-center justify-center space-x-1 p-2.5 rounded-lg border ${
                        formData.numberingDirection === 'ltr' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      <span>Numeruj od lewej (1→10)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, numberingDirection: 'rtl' })}
                      className={`flex items-center justify-center space-x-1 p-2.5 rounded-lg border ${
                        formData.numberingDirection === 'rtl' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 mr-1 transform rotate-180" />
                      <span>Numeruj od prawej (10→1)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wyrównanie zawartości
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, alignment: 'left' })}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border ${
                      formData.alignment === 'left' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, alignment: 'center' })}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border ${
                      formData.alignment === 'center' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, alignment: 'right' })}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border ${
                      formData.alignment === 'right' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Określa sposób wyrównania miejsc wewnątrz sekcji.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Styl numeracji
                </label>
                <select
                  value={formData.numberingStyle}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    numberingStyle: e.target.value as 'arabic' | 'roman' | 'letters'
                  })}
                  className="modal-select"
                >
                  <option value="arabic">Cyfry arabskie (1, 2, 3...)</option>
                  <option value="roman">Cyfry rzymskie (I, II, III...)</option>
                  <option value="letters">Litery (A, B, C...)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <LayoutGrid className="w-4 h-4 mr-1" />
              Podgląd
            </h3>
            {renderPreview()}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="btn-modal-primary"
            >
              Dodaj sekcję
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSectionModal;