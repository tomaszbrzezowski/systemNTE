import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, MapPin, Check, Trash2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { extractSectionsFromLayoutBlocks, sanitizeSectionData } from '../../utils/hall_layout_utils';
import HallLayoutPreview from './HallLayoutPreview';

interface SeatAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  performance: {
    id: string;
    performance_date: string;
    performance_time: string;
    paid_tickets: number;
    unpaid_tickets: number;
    teacher_tickets: number;
    show_titles?: { name: string } | null;
  };
  schoolName: string;
  layoutBlocks: any;
  initialAssignments: Record<string, string>;
  onSave: (assignments: Record<string, string>) => Promise<void>;
}

// Function to validate UUID
const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Function to create a default layout structure when no existing layout is found
const createSimpleLayoutData = () => ({
  sections: {
    'default-section': {
      name: 'PARTER',
      rows: 1,
      rowSeats: [1],
      removedSeats: {},
      emptyRows: [],
      orientation: 'horizontal',
      numbering_style: 'arabic',
      numbering_direction: 'ltr',
      alignment: 'center',
      position: 'center'
    }
  },
  assignments: {},
  schools: []
});

// Function to sanitize layout blocks before saving
const sanitizeLayoutBlocks = (blocks: any[]) => {
  return blocks.map(block => {
    if (block && typeof block === 'object') {
      // Deep clone to avoid mutating the original
      const sanitizedBlock = JSON.parse(JSON.stringify(block));
      
      // Ensure sections is an object
      if (sanitizedBlock.sections && typeof sanitizedBlock.sections === 'object') {
        Object.keys(sanitizedBlock.sections).forEach(sectionKey => {
          const section = sanitizedBlock.sections[sectionKey];
          if (section) {
            // Convert Set to Array for serialization
            if (section.emptyRows instanceof Set) {
              section.emptyRows = Array.from(section.emptyRows);
            }
            if (section.removedSeats) {
              Object.keys(section.removedSeats).forEach(row => {
                if (section.removedSeats[row] instanceof Set) {
                  section.removedSeats[row] = Array.from(section.removedSeats[row]);
                }
              });
            }
          }
        });
      }
      return sanitizedBlock;
    }
    return block;
  });
};

const SeatAssignmentModal: React.FC<SeatAssignmentModalProps> = ({
  isOpen,
  onClose,
  eventId,
  performance,
  schoolName,
  layoutBlocks,
  initialAssignments,
  onSave
}) => {
  const [assignments, setAssignments] = useState<Record<string, string>>(initialAssignments || {});
  
  const updateEventWithLayoutData = async (eventId: string, hallLayout: any, hallId: string) => {
    try {
      if (!isValidUUID(eventId)) {
        throw new Error('Invalid event ID format');
      }

      // Step 1: Get current layout_blocks for the event
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .select('layout_blocks, city_id')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error getting event data:', eventError);
        throw new Error(`Failed to get event data: ${eventError.message}`);
      }

      // Initialize layout_blocks with a safe default structure
      let layoutBlocks = eventData?.layout_blocks && Array.isArray(eventData.layout_blocks) 
        ? [...eventData.layout_blocks] 
        : [];

      // Get hall layout data or create a default one
      const hallLayoutData = hallLayout?.layout_data || createSimpleLayoutData();

      // Ensure hallLayoutData is properly structured
      const sanitizedHallLayoutData = hallLayoutData ? {
        ...hallLayoutData,
        sections: Object.entries(hallLayoutData.sections || {}).reduce((acc, [key, section]) => ({
          ...acc,
          [key]: sanitizeSectionData(section)
        }), {})
      } : {};

      // Find or create the seat_assignments block
      const seatAssignmentsIndex = layoutBlocks.findIndex(block => block && block.type === 'seat_assignments');
      
      if (seatAssignmentsIndex >= 0) {
        // Update existing block with sanitized layout data
        layoutBlocks[seatAssignmentsIndex] = {
          type: 'seat_assignments',
          sections: sanitizedHallLayoutData.sections || {},
          assignments: layoutBlocks[seatAssignmentsIndex].assignments || {},
          schools: layoutBlocks[seatAssignmentsIndex].schools || []
        };
      } else {
        // Create new seat_assignments block with default values
        layoutBlocks.push({
          type: 'seat_assignments',
          sections: sanitizedHallLayoutData.sections || {},
          assignments: {},
          schools: []
        });
      }

      // Sanitize the entire layout_blocks array
      const sanitizedLayoutBlocks = sanitizeLayoutBlocks(layoutBlocks);

      // Step 2: Update the hall_id field in calendar_events table
      const { error: hallError } = await supabase
        .from('calendar_events')
        .update({ hall_id: hallId })
        .eq('id', eventId);

      if (hallError) {
        console.error('Error updating event hall ID:', hallError);
        throw new Error('Failed to update event hall ID');
      }
      
      // Step 3: Update the layout_blocks field in calendar_events table
      const { error: layoutUpdateError } = await supabase
        .from('calendar_events')
        .update({ layout_blocks: sanitizedLayoutBlocks })
        .eq('id', eventId);

      if (layoutUpdateError) {
        console.error('Error updating event layout:', layoutUpdateError);
        throw new Error('Failed to update event layout');
      }

    } catch (error) {
      console.error('Error in updateEventWithLayoutData:', error);
      throw new Error(`Failed to update event with layout data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartSeat, setSelectionStartSeat] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hallLayoutData, setHallLayoutData] = useState<any>(null);
  const [allSchools, setAllSchools] = useState<Array<{ name: string; color: string }>>([]);
  const [sectionColors, setSectionColors] = useState<Record<string, string>>({});

  // Get layout blocks from event
  const getLayoutBlocks = useCallback(() => {
    if (!layoutBlocks) return null;

    // Ensure layout_blocks is an array
    const layoutBlocksArray = Array.isArray(layoutBlocks) 
      ? layoutBlocks 
      : [layoutBlocks];

    // Find the seat_assignments block
    const seatAssignmentsBlock = layoutBlocksArray.find(block => block && block.type === 'seat_assignments');

    return seatAssignmentsBlock;
  }, [layoutBlocks]);
  
  // Load hall layout data
  useEffect(() => {
    const loadHallLayout = async () => {
      if (!isOpen || !eventId) {
        return;
      }

      setLoading(true);

      try {
        // Validate event ID
        if (!isValidUUID(eventId)) {
          throw new Error('Invalid event ID format');
        }

        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('id, hall_id')
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('Error fetching event data:', eventError);
          throw new Error('Failed to fetch event data');
        }

        if (!eventData) {
          throw new Error('Event not found');
        }

        if (!eventData.hall_id) {
          throw new Error('No hall assigned to event');
        }

        // Validate hall ID
        if (!isValidUUID(eventData.hall_id)) {
          throw new Error('Invalid hall ID format');
        }

        const { data: hallData, error: hallError } = await supabase
          .from('halls')
          .select('id, name, hall_layouts(id, layout_data)')
          .eq('id', eventData.hall_id)
          .single();

        if (hallError) {
          console.error('Error fetching hall data:', hallError);
          throw new Error('Failed to fetch hall data');
        }

        if (hallData?.hall_layouts && hallData.hall_layouts.length > 0 && hallData.hall_layouts[0].layout_data) {
          setHallLayoutData(hallData.hall_layouts[0].layout_data);
          await updateEventWithLayoutData(eventId, hallData.hall_layouts[0].layout_data, eventData.hall_id);
        } else {
          const defaultLayout = createSimpleLayoutData();
          setHallLayoutData(defaultLayout);
          await updateEventWithLayoutData(eventId, defaultLayout, eventData.hall_id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load hall layout:', error);
        toast.error(`Failed to load hall layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    loadHallLayout();
  }, [isOpen, eventId, performance]);

  // Handle seat click
  const handleSeatClick = useCallback((sectionId: string, rowIndex: number, seatIndex: number) => {
    const seatId = `${sectionId}-${rowIndex}-${seatIndex}`;
    
    // Toggle seat assignment
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      if (newAssignments[seatId]) {
        // If already assigned, remove assignment
        delete newAssignments[seatId];
      } else {
        // Otherwise, assign to current school
        newAssignments[seatId] = schoolName;
      }
      
      return newAssignments;
    });
  }, [schoolName]);

  // Generate random colors for sections
  useEffect(() => {
    if (!layoutBlocks) return;
    
    const layoutBlock = getLayoutBlocks();
    if (!layoutBlock || !layoutBlock.sections) return;
    
    const colors: Record<string, string> = {};
    const sectionKeys = Object.keys(layoutBlock.sections);
    
    // Generate pastel colors for each section
    sectionKeys.forEach((key, index) => {
      // Generate a pastel color based on index
      const hue = (index * 137) % 360; // Golden angle to distribute colors
      colors[key] = `hsl(${hue}, 70%, 80%)`;
    });
    
    setSectionColors(colors);
  }, [layoutBlocks, getLayoutBlocks]);

  // Prepare schools data for the layout preview
  const schoolsData = useMemo(() => {
    const uniqueSchools = new Set(Object.values(assignments));
    const schoolsArray: Array<{ name: string; color: string }> = [];
    
    // Generate a unique color for each school
    Array.from(uniqueSchools).forEach((school, index) => {
      const hue = (index * 137) % 360; // Golden angle to distribute colors
      schoolsArray.push({
        name: school,
        color: `hsl(${hue}, 70%, 60%)`
      });
    });
    
    return schoolsArray;
  }, [assignments]);

  // Handle save
  const handleSave = async () => {
    try {
      await onSave(assignments);
      toast.success('Przypisania miejsc zostały zapisane');
      onClose();
    } catch (error) {
      console.error('Failed to save seat assignments:', error);
      toast.error('Nie udało się zapisać przypisań miejsc');
    }
  };

  // Get sections from layout blocks
  const sections = useMemo(() => {
    const layoutBlock = getLayoutBlocks();
    if (!layoutBlock || !layoutBlock.sections) return {};
    return layoutBlock.sections;
  }, [getLayoutBlocks]);

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                Przypisz miejsca dla szkoły
              </h2>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="mt-4 bg-white/10 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-white">{schoolName}</h3>
                <p className="text-sm text-white/80">
                  {performance.show_titles?.name || 'Spektakl'} - {new Date(performance.performance_date).toLocaleDateString('pl-PL')} {performance.performance_time.substring(0, 5)}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  Bilety: {performance.paid_tickets} płatne, {performance.unpaid_tickets} bezpłatne, {performance.teacher_tickets} dla nauczycieli
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-white font-medium">
                  Przypisane miejsca: {Object.keys(assignments).length}
                </div>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Zapisz przypisania</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-2xl">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Instrukcja:</h3>
                <p className="text-sm text-gray-600">
                  Kliknij na miejsce, aby przypisać je do szkoły <strong>{schoolName}</strong>. 
                  Kliknij ponownie, aby usunąć przypisanie. Po zakończeniu kliknij "Zapisz przypisania".
                </p>
              </div>
              
              <div className="w-full overflow-x-auto">
                <HallLayoutPreview
                  sections={sections}
                  sectionNames={Object.fromEntries(
                    Object.entries(sections).map(([key, section]) => [
                      key, 
                      section.name || key.toUpperCase()
                    ])
                  )}
                  sectionColors={sectionColors}
                  seatAssignments={assignments}
                  schools={schoolsData}
                  onSeatClick={handleSeatClick}
                  isPreviewMode={true}
                />
              </div>
              
              {schoolsData.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-2xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h3>
                  <div className="flex flex-wrap gap-4">
                    {schoolsData.map(school => (
                      <div key={school.name} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: school.color }}
                        />
                        <span className="text-sm text-gray-700">{school.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              className="btn-modal-primary flex items-center gap-2"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              <span>Zapisz przypisania</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatAssignmentModal;