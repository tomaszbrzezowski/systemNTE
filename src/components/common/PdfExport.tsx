import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PdfExportProps {
  contentRef: React.RefObject<HTMLElement>;
  fileName?: string;
  onExport?: () => void;
}

const PdfExport: React.FC<PdfExportProps> = ({ 
  contentRef, 
  fileName = 'document.pdf',
  onExport 
}) => {
  const [scale, setScale] = useState(100);

  const handleExport = async () => {
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
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);

      if (onExport) {
        onExport();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
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
      </div>

      <button
        onClick={handleExport}
        className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2"
      >
        <Download className="w-5 h-5" />
        <span>Eksportuj PDF</span>
      </button>
    </div>
  );
};

export default PdfExport;