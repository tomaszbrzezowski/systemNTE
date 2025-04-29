import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import HallLayoutGrid from './HallLayoutGrid';
import { useRef, useLayoutEffect } from 'react';
import PreviewModal from './PreviewModal';

interface SectionBlock {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rows: number;
  rowSeats: number[];
  removedSeats: { [key: number]: Set<number> };
  seatGaps: { [key: number]: Set<number> };
  emptyRows: Set<number>;
  orientation: 'horizontal' | 'vertical';
  numberingStyle: 'arabic' | 'roman' | 'letters';
  numberingDirection: 'ltr' | 'rtl';
  alignment: 'left' | 'center' | 'right';
  position: 'center' | 'left' | 'right' | 'back';
  rowAlignments?: { [key: number]: 'left' | 'center' | 'right' };
}

const HallLayoutPreview: React.FC = () => {
  const navigate = useNavigate();
  const { hallId } = useParams<{ hallId: string }>();
  
  // Validate hallId is a valid UUID
  const isValidUUID = hallId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  
  // Redirect to halls list if the hallId is not a valid UUID
  useEffect(() => {
    if (hallId && !isValidUUID) {
      navigate('/events/halls');
    }
  }, [hallId, isValidUUID, navigate]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hallName, setHallName] = useState('');
  const [hallCity, setHallCity] = useState('');
  const [hallAddress, setHallAddress] = useState('');
  const [sections, setSections] = useState<Record<string, any>>({});
  const [sectionNames, setSectionNames] = useState<Record<string, string>>({});
  const [sectionNumberingStyles, setSectionNumberingStyles] = useState<Record<string, any>>({});
  const [numberingDirections, setNumberingDirections] = useState<Record<string, any>>({});
  const [rowLabels, setRowLabels] = useState<Record<string, Record<number, string>>>({});
  const [removedSeats, setRemovedSeats] = useState<Record<string, Record<number, any>>>({});
  const [emptyRows, setEmptyRows] = useState<Record<string, any>>({});
  const [rowSeatsPerRow, setRowSeatsPerRow] = useState<Record<string, Record<number, number>>>({});
  const [sectionAlignments, setSectionAlignments] = useState<Record<string, any>>({});
  const [rowAlignments, setRowAlignments] = useState<Record<string, Record<number, any>>>({});
  const [totalSeats, setTotalSeats] = useState(0);
  const [printScale, setPrintScale] = useState(1);
  const layoutRef = useRef<HTMLDivElement>(null);
  
  // A4 width in pixels (96 DPI)
  const MAX_PRINT_WIDTH = 794;

  useEffect(() => {
    const loadHallData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!hallId) {
          throw new Error('Hall ID is required');
        }

        const { data: hall, error: hallError } = await supabase
          .from('halls')
          .select(`
            id,
            name,
            address,
            city_id,
            cities (
              id,
              name,
              voivodeship
            )
          `)
          .eq('id', hallId)
          .single();

        if (hallError) {
          throw hallError;
        }

        if (!hall) {
          throw new Error('Hall not found');
        }

        setHallName(hall.name);
        setHallCity(hall.cities?.name || '');
        setHallAddress(hall.address);
        
        // Check if there's an existing layout
        const { data: layoutData, error: layoutError } = await supabase
          .from('hall_layouts')
          .select('*')
          .eq('hall_id', hallId)
          .maybeSingle();
          
        if (!layoutError && layoutData) {
          setTotalSeats(layoutData.total_seats || 0);
          
          // If there's layout data with section-specific settings, use those
          if (layoutData.layout_data) {
            try {
              const parsedData = typeof layoutData.layout_data === 'string' 
                ? JSON.parse(layoutData.layout_data) 
                : layoutData.layout_data;

              if (!parsedData) {
                throw new Error('Invalid layout data');
              }
              
              // Process sections data
              if (parsedData.sections && typeof parsedData.sections === 'object') {
                const processedSections: Record<string, SectionBlock> = {};
                
                // Extract section names, numbering styles, etc.
                const extractedSectionNames: Record<string, string> = {};
                const extractedSectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'> = {};
                const extractedNumberingDirections: Record<string, 'ltr' | 'rtl'> = {};
                const extractedRowLabels: Record<string, Record<number, string>> = {};
                const extractedRemovedSeats: Record<string, Record<number, Set<number>>> = {};
                const extractedEmptyRows: Record<string, Set<number>> = {};
                const extractedRowSeatsPerRow: Record<string, Record<number, number>> = {};
                const extractedSectionAlignments: Record<string, 'left' | 'center' | 'right'> = {};
                const extractedRowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>> = {};
                
                Object.entries(parsedData.sections).forEach(([key, value]) => {
                  if (typeof value === 'object' && value !== null) {
                    const sectionData = value as any;
                    
                    // Skip disabled sections
                    if (sectionData.enabled === false) {
                      return;
                    }
                    
                    // Convert removedSeats from arrays to Sets for easier lookup
                    const removedSeats: { [key: number]: Set<number> } = {};
                    if (parsedData.removedSeats && parsedData.removedSeats[key]) {
                      Object.entries(parsedData.removedSeats[key]).forEach(([rowIndex, seats]) => {
                        if (Array.isArray(seats)) {
                          removedSeats[Number(rowIndex)] = new Set(seats);
                        }
                      });
                    }
                    
                    // Convert emptyRows from arrays to Sets
                    const emptyRows = new Set<number>();
                    if (parsedData.emptyRows && parsedData.emptyRows[key]) {
                      if (Array.isArray(parsedData.emptyRows[key])) {
                        parsedData.emptyRows[key].forEach((row: number) => {
                          emptyRows.add(row);
                        });
                      }
                    }
                    
                    // Store extracted data
                    extractedSectionNames[key] = parsedData.sectionNames?.[key] || key;
                    extractedSectionNumberingStyles[key] = parsedData.sectionNumberingStyles?.[key] || 'arabic';
                    extractedNumberingDirections[key] = parsedData.numberingDirections?.[key] || 'ltr';
                    extractedRowLabels[key] = parsedData.rowLabels?.[key] || {};
                    extractedRemovedSeats[key] = removedSeats;
                    extractedEmptyRows[key] = emptyRows;
                    extractedSectionAlignments[key] = parsedData.sectionAlignments?.[key] || 'center';
                    extractedRowAlignments[key] = parsedData.rowAlignments?.[key] || {};
                    
                    // Determine position based on section name
                    let position: 'center' | 'left' | 'right' | 'back' = 'center';
                    const sectionName = parsedData.sectionNames?.[key] || '';
                    
                    if (sectionName.includes('LEWY')) {
                      position = 'left';
                    } else if (sectionName.includes('PRAWY')) {
                      position = 'right';
                    } else if (sectionName.includes('BALKON')) {
                      position = 'back';
                    }
                    
                    // Create section block
                    processedSections[key] = {
                      id: key,
                      name: parsedData.sectionNames?.[key] || key,
                      x: 0,
                      y: 0,
                      width: 30,
                      height: 20,
                      rotation: 0,
                      rows: sectionData.rows || 0,
                      rowSeats: Array(sectionData.rows).fill(sectionData.seatsPerRow),
                      removedSeats,
                      seatGaps: {},
                      emptyRows,
                      orientation: 'horizontal',
                      numberingStyle: parsedData.sectionNumberingStyles?.[key] || 'arabic',
                      numberingDirection: 'ltr',
                      alignment: 'center',
                      position
                    };
                  }
                });
                
                setSections(processedSections);
                setSectionNames(extractedSectionNames);
                setSectionNumberingStyles(extractedSectionNumberingStyles);
                setNumberingDirections(extractedNumberingDirections);
                setRowLabels(extractedRowLabels);
                setRemovedSeats(extractedRemovedSeats);
                setEmptyRows(extractedEmptyRows);
                setRowSeatsPerRow(extractedRowSeatsPerRow);
                setSectionAlignments(extractedSectionAlignments);
                setRowAlignments(extractedRowAlignments);
              }
            } catch (e) {
              console.error('Error parsing layout data:', e);
              toast.error('Błąd podczas wczytywania planu sali');
            }
          }
        }
        
      } catch (error) {
        console.error('Failed to load hall data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadHallData();
  }, [hallId]);
  
  // Calculate scale factor to fit content within printable area
  useLayoutEffect(() => {
    if (layoutRef.current && !loading) {
      const layoutWidth = layoutRef.current.scrollWidth;
      
      // Calculate scale factor
      const scale = layoutWidth > MAX_PRINT_WIDTH
        ? MAX_PRINT_WIDTH / layoutWidth
        : 1;
      
      setPrintScale(scale * 0.95); // 95% to add some margin
    }
  }, [sections, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-500">Ładowanie danych sali...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 max-w-md">
          <h3 className="font-bold mb-2">Błąd</h3>
          <p>{error}</p>
          <div className="mt-4">
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Powrót
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Powrót</span>
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 print-container mb-6 overflow-hidden">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{hallName}</h1>
            <p className="text-gray-600">{hallCity}, {hallAddress}</p>
            <p className="text-gray-500">Liczba miejsc: {totalSeats}</p>
          </div>
          
          <div className="bg-gray-900 text-white w-full max-w-[480px] py-2 text-sm font-medium rounded border-b-4 border-gray-800 mx-auto mb-8 text-center">
            <div className="flex items-center justify-center">SCENA</div>
          </div>
          
          <HallLayoutGrid
            sections={sections}
            sectionNumberingStyles={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.numberingStyle || 'arabic'
              ])
            )}
            numberingDirections={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.numberingDirection || 'ltr'
              ])
            )}
            sectionNames={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.name || key.toUpperCase()
              ])
            )}
            selectedSection={null}
            onSelectSection={() => {}}
            rowLabels={{}}
            removedSeats={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.removedSeats || {}
              ])
            )}
            emptyRows={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.emptyRows || new Set()
              ])
            )}
            onSectionNameChange={() => {}}
            onRemoveSeat={() => {}}
            rowSeatsPerRow={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                Object.fromEntries(
                  Array.from({ length: section.rows || 0 }, (_, i) => [
                    i, 
                    section.rowSeats?.[i] || section.seatsPerRow || 0
                  ])
                )
              ])
            )}
            onAddEmptyRow={() => {}}
            sectionAlignments={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.alignment || 'center'
              ])
            )}
            rowAlignments={Object.fromEntries(
              Object.entries(sections).map(([key, section]) => [
                key, 
                section.rowAlignments || {}
              ])
            )}
            autoRenumberSeats={true}
          />
          <div className="text-center mt-8 text-gray-500">
            <p>Podgląd planu sali</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export a version of the component that can be used for seat assignments
export const HallLayoutPreviewForAssignments: React.FC<{
  sections: Record<string, any>;
  sectionNames: Record<string, string>;
  sectionColors?: Record<string, string>;
  seatAssignments?: Record<string, string>;
  schools?: Array<{ name: string; color: string }>;
  onSeatClick?: (sectionId: string, rowIndex: number, seatIndex: number) => void;
  isPreviewMode?: boolean;
}> = ({
  sections,
  sectionNames,
  sectionColors = {},
  seatAssignments = {},
  schools = [],
  onSeatClick,
  isPreviewMode = true
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 print-container mb-6 overflow-hidden">
      <div className="bg-gray-900 text-white w-full max-w-[480px] py-2 text-sm font-medium rounded border-b-4 border-gray-800 mx-auto mb-8 text-center">
        <div className="flex items-center justify-center">SCENA</div>
      </div>
      
      <HallLayoutGrid
        sections={sections}
        sectionNumberingStyles={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.numberingStyle || 'arabic'
          ])
        )}
        numberingDirections={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.numberingDirection || 'ltr'
          ])
        )}
        sectionNames={sectionNames}
        selectedSection={null}
        onSelectSection={() => {}}
        rowLabels={{}}
        removedSeats={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.removedSeats || {}
          ])
        )}
        emptyRows={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.emptyRows || new Set()
          ])
        )}
        onSectionNameChange={() => {}}
        onRemoveSeat={() => {}}
        rowSeatsPerRow={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            Object.fromEntries(
              Array.from({ length: section.rows || 0 }, (_, i) => [
                i, 
                section.rowSeats?.[i] || section.seatsPerRow || 0
              ])
            )
          ])
        )}
        onAddEmptyRow={() => {}}
        sectionAlignments={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.alignment || 'center'
          ])
        )}
        rowAlignments={Object.fromEntries(
          Object.entries(sections).map(([key, section]) => [
            key, 
            section.rowAlignments || {}
          ])
        )}
        autoRenumberSeats={true}
        isPreviewMode={isPreviewMode}
        seatAssignments={seatAssignments}
        schools={schools}
        showLegend={true}
        sectionColors={sectionColors}
        onSeatClick={onSeatClick}
      />
    </div>
  );
};

export default HallLayoutPreview;