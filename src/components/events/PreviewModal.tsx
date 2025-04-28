import React, { useState, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Printer, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Define a scale factor to ensure all sections fit properly
const PREVIEW_SCALE_FACTOR = 0.8;

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  hallName: string;
  hallAddress: string;
  hallCity: string;
  totalSeats: number;
  orientation: 'portrait' | 'landscape';
  children: React.ReactNode;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onExport: originalOnExport,
  hallName, 
  hallAddress, 
  hallCity, 
  totalSeats,
  orientation = 'portrait',
  children 
}) => {
  const [scale, setScale] = useState(100);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    
    try {
      // Capture the content as canvas
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit on A4
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save(`${hallName.replace(/\s+/g, '_')}_layout.pdf`);
      
      // Call original onExport if provided
      if (originalOnExport) {
        originalOnExport();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safely access sections with null checks and default values
  const sections = (children as any)?.props?.sections || {};

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-[1200px] mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Podgląd wydruku</h2>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* A4 Preview Container */}
          <div 
            ref={contentRef}
            className="w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden flex flex-col print:shadow-none"
            style={{ maxWidth: '1000px' }} id="printable-content">
            <div className="p-3 text-center border-b border-gray-200 flex-shrink-0">
              <h1 className="text-lg font-bold text-gray-900">{hallName}</h1>
              <p className="text-xs text-gray-600">{hallCity}, {hallAddress} • Liczba miejsc: {totalSeats}</p>
              <div className="bg-gray-900 text-white w-full max-w-[480px] py-2 text-sm font-medium rounded border-b-4 border-gray-800 mx-auto mt-3">
                <div className="flex items-center justify-center">SCENA</div>
              </div>
            </div>

            {/* Layout Content */}
            <div className="flex-1 p-2 flex items-center justify-center text-center print-content">
              <div className="w-full transform-none" style={{ transform: `scale(${PREVIEW_SCALE_FACTOR})`, transformOrigin: 'top center' }}>
                <div className={`grid ${
                  // Determine grid columns based on sections present
                  Object.values(sections).some(s => s.position === 'left') && 
                  Object.values(sections).some(s => s.position === 'right')
                    ? 'grid-cols-3' // Both left and right sections exist
                    : Object.values(sections).some(s => s.position === 'left') || 
                      Object.values(sections).some(s => s.position === 'right')
                      ? 'grid-cols-2' // Either left or right sections exist
                      : 'grid-cols-1' // Only center/back sections
                } gap-4`}>
                  {/* Left column */}
                  {Object.values(sections).some(s => s.position === 'left') && (
                    <div className="flex flex-col gap-4">
                      {Object.entries(sections)
                        .filter(([_, section]) => section.position === 'left')
                        .map(([id, section]) => (
                          <div key={id} className="border rounded-lg overflow-hidden">
                            <div className="p-2 text-sm font-medium text-center border-b bg-gray-50 flex items-center justify-center">
                              {section.name}
                            </div>
                            <div className="p-2">
                              {React.isValidElement(children) && React.cloneElement(children, {
                                ...children.props,
                                sections: { [id]: section }
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  
                  {/* Center column */}
                  <div className={`flex flex-col gap-4 ${
                    // If only center sections exist, make them take full width
                    !Object.values(sections).some(s => s.position === 'left') && 
                    !Object.values(sections).some(s => s.position === 'right')
                      ? 'col-span-full'
                      : ''
                  }`}>
                    {Object.entries(sections)
                      .filter(([_, section]) => section.position === 'center')
                      .map(([id, section]) => {
                        return (
                        <div key={id} className="border rounded-lg overflow-hidden">
                          <div className="p-2 text-sm font-medium text-center border-b bg-gray-50 flex items-center justify-center">
                            {section.name}
                          </div>
                          <div className="p-2">
                            {React.isValidElement(children) && React.cloneElement(children, {
                              ...children.props,
                              sections: { [id]: section }
                            })}
                          </div>
                        </div>
                      )})}
                  </div>
                  
                  {/* Right column */}
                  {Object.values(sections).some(s => s.position === 'right') && (
                    <div className="flex flex-col gap-4">
                      {Object.entries(sections)
                        .filter(([_, section]) => section.position === 'right')
                        .map(([id, section]) => (
                          <div key={id} className="border rounded-lg overflow-hidden">
                            <div className="p-2 text-sm font-medium text-center border-b bg-gray-50 flex items-center justify-center">
                              {section.name}
                            </div>
                            <div className="p-2">
                              {React.isValidElement(children) && React.cloneElement(children, {
                                ...children.props,
                                sections: { [id]: section }
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Back sections */}
                <div className="mt-4 w-full">
                  {Object.entries(sections)
                    .filter(([_, section]) => section.position === 'back')
                    .map(([id, section]) => (
                      <div key={id} className="border rounded-lg overflow-hidden mb-4">
                        <div className="p-2 text-sm font-medium text-center border-b bg-gray-50 flex items-center justify-center">
                          {section.name}
                        </div>
                        <div className="p-2">
                          {React.isValidElement(children) && React.cloneElement(children, {
                            ...children.props,
                            sections: { [id]: section }
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="modal-footer flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setScale(Math.max(20, scale - 10))}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zmniejsz"
            >
              <ZoomOut className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="250"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600 min-w-[4ch]">
                {scale}%
              </span>
            </div>

            <button
              onClick={() => setScale(Math.min(250, scale + 10))}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Powiększ"
            >
              <ZoomIn className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setScale(100)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            > 
              Zamknij
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>Drukuj</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Eksportuj PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;