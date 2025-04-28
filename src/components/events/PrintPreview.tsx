import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Printer, FileText, FlipHorizontal as LayoutHorizontal, FlipVertical as LayoutVertical } from 'lucide-react';
import HallLayoutGrid from './HallLayoutGrid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: () => void;
  hallName: string;
  hallAddress: string;
  hallCity: string;
  totalSeats: number;
  sections: Record<string, any>;
  sectionNames: Record<string, string>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  emptyRows: Record<string, Set<number>>;
  rowLabels: Record<string, Record<number, string>>;
  rowSeatsPerRow?: Record<string, Record<number, number>>;
  sectionAlignments?: Record<string, 'left' | 'center' | 'right'>;
  rowAlignments?: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  initialOrientation?: 'portrait' | 'landscape';
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpen,
  onClose,
  onExport,
  hallName,
  hallAddress,
  hallCity,
  totalSeats,
  sections,
  sectionNames,
  numberingDirections = {},
  sectionNumberingStyles,
  removedSeats,
  emptyRows,
  rowLabels,
  rowSeatsPerRow = {},
  sectionAlignments = {},
  rowAlignments = {},
  initialOrientation = 'portrait'
}) => {
  const [scale, setScale] = useState(100);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialOrientation || 'portrait');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // A4 width in pixels (96 DPI)
  const MAX_PRINT_WIDTH = orientation === 'portrait' ? 794 : 1123; // A4 width in pixels

  useEffect(() => {
    if (contentRef.current && isOpen) {
      const layoutWidth = contentRef.current.scrollWidth;
      
      // Calculate scale factor
      const scale = layoutWidth > MAX_PRINT_WIDTH
        ? MAX_PRINT_WIDTH / layoutWidth
        : 1;
      
      setScale(scale * 0.95); // 95% to add some margin
    }
  }, [sections, isOpen]);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${hallName.replace(/\s+/g, '_')}_layout.pdf`);

      if (onExport) {
        onExport();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                Podgląd wydruku planu sali
              </h2>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="mt-4 bg-white/10 rounded-lg p-4 text-white">
            <h3 className="text-lg font-medium">{hallName}</h3>
            <p className="text-sm text-white/80">{hallCity}, {hallAddress}</p>
            <p className="text-sm text-white/80">Liczba miejsc: {totalSeats}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mr-4">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`p-2 ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors`}
                  title="Orientacja pionowa"
                >
                  <LayoutVertical className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`p-2 ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors`}
                  title="Orientacja pozioma"
                >
                  <LayoutHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => setScale(Math.max(50, scale - 10))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zmniejsz"
              >
                <ZoomOut className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 min-w-[4ch]">
                  {scale}%
                </span>
              </div>

              <button
                onClick={() => setScale(Math.min(150, scale + 10))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Powiększ"
              >
                <ZoomIn className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setScale(100)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div 
            ref={contentRef}
            className="print-wrapper origin-top transform bg-white overflow-hidden mx-auto print:block" 
            style={{
              transformOrigin: 'top center', 
              maxWidth: '100%',
              transform: `scale(${scale/100})`,
              width: 'fit-content',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div className={`print-content print:block ${orientation === 'landscape' ? 'a4-landscape' : 'a4-portrait'}`}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{hallName}</h1>
                <p className="text-gray-600">{hallCity}, {hallAddress}</p>
                <p className="text-gray-500">Liczba miejsc: {totalSeats}</p>
              </div>
              
              <HallLayoutGrid
                sections={sections}
                sectionNumberingStyles={sectionNumberingStyles}
                numberingDirections={numberingDirections}
                sectionNames={sectionNames}
                selectedSection={null}
                onSelectSection={() => {}}
                rowLabels={rowLabels}
                removedSeats={removedSeats}
                emptyRows={emptyRows}
                onSectionNameChange={() => {}}
                rowSeatsPerRow={rowSeatsPerRow}
                sectionAlignments={sectionAlignments}
                rowAlignments={rowAlignments}
                autoRenumberSeats={true}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Zamknij
            </button>
            <button
              onClick={() => window.print()}
              className="btn-modal-primary flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Drukuj</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="btn-modal-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4 mr-1" />
              <span>Eksportuj PDF ({orientation === 'portrait' ? 'pionowo' : 'poziomo'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;