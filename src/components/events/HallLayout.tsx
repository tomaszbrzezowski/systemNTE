import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Save, Plus, Minus, Check, Settings, Edit2, ListOrdered, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import SectionOverviewModal from './SectionOverviewModal';
import HallLayoutGrid from './HallLayoutGrid';
import SectionNameEditModal from './SectionNameEditModal';
import PrintPreview from './PrintPreview';
import LayoutConfigDrawer from './LayoutConfigDrawer';
import RowSeatsModal from './RowSeatsModal';
import { RotateCcw } from 'lucide-react';
import { getDefaultLayoutState } from '../../utils/HallLayoutResetUtil';
import { sanitizeLayoutBlocks } from '../../utils/hall_layout_utils';

const getRowLabel = (rowIndex: number, section: string, style: 'arabic' | 'roman' | 'letters' = 'arabic'): string => {
  switch (style) {
    case 'roman':
      return toRoman(rowIndex + 1);
    case 'letters':
      return String.fromCharCode(65 + rowIndex); // A = 65 in ASCII
    case 'arabic':
    default:
      return (rowIndex + 1).toString();
  }
};

interface SectionConfig {
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
}

const mergeWithDefaultSectionNames = (incoming: Record<string, string> = {}) => {
  const defaultNames: Record<string, string> = {
    main: 'PARTER',
    left: 'BALKON LEWY I',
    left1: 'BALKON LEWY II',
    left2: 'BALKON LEWY III',
    right: 'BALKON PRAWY I',
    right1: 'BALKON PRAWY II',
    right2: 'BALKON PRAWY III',
    back: 'BALKON I',
    back1: 'BALKON II',
    back2: 'BALKON III',
  };

  return {
    ...defaultNames,
    ...incoming,
  };
};

const HallLayout: React.FC = () => {
  const navigate = useNavigate();
  const { id: hallId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hallName, setHallName] = useState('');
  const [hallCity, setHallCity] = useState('');
  const [hallAddress, setHallAddress] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    parter: boolean;
    rightBalconies: boolean;
    leftBalconies: boolean;
    backBalconies: boolean;
  }>({
    parter: true,
    rightBalconies: true,
    leftBalconies: true,
    backBalconies: true
  });
  const [sections, setSections] = useState<Record<string, SectionConfig>>({
    main: { enabled: true, rows: 10, seatsPerRow: 10 },
    left: { enabled: false, rows: 3, seatsPerRow: 3 },
    right: { enabled: false, rows: 3, seatsPerRow: 3 },
    back: { enabled: false, rows: 3, seatsPerRow: 10 },
    back1: { enabled: false, rows: 3, seatsPerRow: 10 },
    back2: { enabled: false, rows: 3, seatsPerRow: 10 },
    left1: { enabled: false, rows: 3, seatsPerRow: 3 },
    left2: { enabled: false, rows: 3, seatsPerRow: 3 },
    right1: { enabled: false, rows: 3, seatsPerRow: 3 },
    right2: { enabled: false, rows: 3, seatsPerRow: 3 }
  });
  const [sectionNumberingStyles, setSectionNumberingStyles] = useState<Record<string, 'arabic' | 'roman' | 'letters'>>({
    main: 'arabic',
    left: 'arabic',
    right: 'arabic',
    back: 'arabic',
    back1: 'arabic',
    back2: 'arabic',
    left1: 'arabic',
    left2: 'arabic',
    right1: 'arabic',
    right2: 'arabic'
  });
  const [saving, setSaving] = useState(false);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<'main' | 'left' | 'right' | 'back' | 'back1' | 'back2' | 'left1' | 'left2' | 'right1' | 'right2' | null>(null);
  const [showSectionConfig, setShowSectionConfig] = useState(false);
  const [rowLabels, setRowLabels] = useState<Record<string, Record<number, string>>>({
    main: {},
    left: {},
    right: {},
    back: {},
    back1: {},
    back2: {},
    left1: {},
    left2: {},
    right1: {},
    right2: {}
  });
  const [totalSeats, setTotalSeats] = useState(0);
  const [showSectionNameModal, setShowSectionNameModal] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<string | null>(null);
  const [emptyRows, setEmptyRows] = useState<Record<string, Set<number>>>({
    main: new Set<number>(),
    left: new Set<number>(),
    right: new Set<number>(),
    back: new Set<number>(),
    back1: new Set<number>(),
    back2: new Set<number>(),
    left1: new Set<number>(),
    left2: new Set<number>(),
    right1: new Set<number>(),
    right2: new Set<number>()
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [skipRemovedSeatsVisual, setSkipRemovedSeatsVisual] = useState(true);
  const [autoRenumberSeats, setAutoRenumberSeats] = useState(false);
  const [removedSeats, setRemovedSeats] = useState<Record<string, Record<number, Set<number>>>>({
    main: {},
    left: {},
    right: {},
    back: {},
    back1: {},
    back2: {},
    left1: {},
    left2: {},
    right1: {},
    right2: {}
  });
  const [rowSeatsPerRow, setRowSeatsPerRow] = useState<Record<string, Record<number, number>>>({
    main: {},
    left: {},
    right: {},
    back: {},
    back1: {},
    back2: {},
    left1: {},
    left2: {},
    right1: {},
    right2: {}
  });
  const [showRowSeatsModal, setShowRowSeatsModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{section: string, rowIndex: number, rowLabel: string} | null>(null);
  const [numberingDirections, setNumberingDirections] = useState<Record<string, 'ltr' | 'rtl'>>({
    main: 'ltr',
    left: 'ltr',
    right: 'ltr',
    back: 'ltr',
    back1: 'ltr',
    back2: 'ltr',
    left1: 'ltr',
    left2: 'ltr',
    right1: 'ltr',
    right2: 'ltr'
  });
  const [sectionNames, setSectionNames] = useState<Record<string, string>>(mergeWithDefaultSectionNames());
  const [rowAlignments, setRowAlignments] = useState<Record<string, Record<number, 'left' | 'center' | 'right'>>>({
    main: {},
    left: {},
    right: {},
    back: {},
    back1: {},
    back2: {},
    left1: {},
    left2: {},
    right1: {},
    right2: {}
  });
  const [sectionAlignments, setSectionAlignments] = useState<Record<string, 'left' | 'center' | 'right'>>({
    main: 'center',
    left: 'center',
    right: 'center',
    back: 'center',
    back1: 'center',
    back2: 'center',
    left1: 'center',
    left2: 'center',
    right1: 'center',
    right2: 'center'
  });

  const resetLayout = () => {
    if (!window.confirm('Czy na pewno chcesz zresetować plan sali? Ta operacja jest nieodwracalna.')) return;

    const defaultState = getDefaultLayoutState();

    setSections(defaultState.sections);
    setSectionNames(defaultState.sectionNames);
    setSectionNumberingStyles(defaultState.sectionNumberingStyles);
    setNumberingDirections(defaultState.numberingDirections);
    setRowLabels(defaultState.rowLabels);
    setRemovedSeats(defaultState.removedSeats);
    setEmptyRows(defaultState.emptyRows);
    setRowSeatsPerRow(defaultState.rowSeatsPerRow);
    setRowAlignments(defaultState.rowAlignments);
    setSectionAlignments(defaultState.sectionAlignments);

    toast.success('Plan sali został zresetowany do domyślnych ustawień.');
  };

  const handleRenumberSeats = (section: string) => {
    if (!sections[section]) return;

    const newRemovedSeats = { ...removedSeats };
    const newRowSeatsPerRow = { ...rowSeatsPerRow };

    // For each row in the section
    for (let rowIndex = 0; rowIndex < sections[section].rows; rowIndex++) {
      if (emptyRows[section]?.has(rowIndex)) continue;

      const seatsInRow = rowSeatsPerRow[section]?.[rowIndex] || sections[section].seatsPerRow;
      let currentSeatNumber = 1;

      // Create a new Set for removed seats if it doesn't exist
      if (!newRemovedSeats[section]) {
        newRemovedSeats[section] = {};
      }

      // Get or create the Set of removed seats for this row
      if (!newRemovedSeats[section][rowIndex]) {
        newRemovedSeats[section][rowIndex] = new Set();
      }

      // Update row seats if needed
      if (!newRowSeatsPerRow[section]) {
        newRowSeatsPerRow[section] = {};
      }
      newRowSeatsPerRow[section][rowIndex] = seatsInRow;
    }

    setRemovedSeats(newRemovedSeats);
    setRowSeatsPerRow(newRowSeatsPerRow);
  };

  const handleRenumberRows = (section: string) => {
    if (!sections[section]) return;

    const newRowLabels = { ...rowLabels };
    if (!newRowLabels[section]) {
      newRowLabels[section] = {};
    }

    // Clear existing row labels for this section
    Object.keys(newRowLabels[section]).forEach(key => {
      delete newRowLabels[section][parseInt(key)];
    });

    // Generate new row labels based on the numbering style
    for (let i = 0; i < sections[section].rows; i++) {
      if (!emptyRows[section]?.has(i)) {
        newRowLabels[section][i] = getRowLabel(i, section, sectionNumberingStyles[section]);
      }
    }

    setRowLabels(newRowLabels);
  };

  useEffect(() => {
    if (selectedSection) {
      handleRenumberSeats(selectedSection);
    }
  }, [skipRemovedSeatsVisual]);

  useEffect(() => {
    let total = 0;
    
    Object.entries(sections).forEach(([sectionKey, sectionConfig]) => {
      if (sectionConfig.enabled) {
        let sectionTotal = 0;
        for (let i = 0; i < sectionConfig.rows; i++) {
          if (emptyRows[sectionKey]?.has(i)) continue;
          
          sectionTotal += sectionConfig.seatsPerRow;
        }
        
        if (removedSeats[sectionKey]) {
          Object.values(removedSeats[sectionKey]).forEach(seats => {
            sectionTotal -= seats.size;
          });
        }
        
        total += sectionTotal;
      }
    });
    
    setTotalSeats(total);
  }, [sections, removedSeats, emptyRows]);

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
        
        const { data: layoutData, error: layoutError } = await supabase
          .from('hall_layouts')
          .select('*')
          .eq('hall_id', hallId)
          .maybeSingle();
          
        if (!layoutError && layoutData) {
          setSections(prev => ({
            ...prev,
            main: { 
              ...prev.main, 
              rows: layoutData.rows || 10, 
              seatsPerRow: layoutData.seats_per_row || 10 
            }
          }));
          
          if (layoutData.layout_data) {
            try {
              const parsedData = typeof layoutData.layout_data === 'string' 
                ? JSON.parse(layoutData.layout_data) 
                : layoutData.layout_data;

              if (!parsedData) {
                throw new Error('Invalid layout data');
              }
              
              const newSections = { ...sections };
              
              const newSectionNumberingStyles = { ...sectionNumberingStyles };
              
              const newRemovedSeats = { ...removedSeats };
              
              if (parsedData.sections && typeof parsedData.sections === 'object') {
                Object.entries(parsedData.sections).forEach(([key, value]) => {
                  if (newSections[key] && typeof value === 'object' && value !== null) {
                    const sectionData = value as any;
                    newSections[key] = {
                      enabled: typeof sectionData.enabled === 'boolean' ? sectionData.enabled : newSections[key].enabled,
                      rows: typeof sectionData.rows === 'number' ? sectionData.rows : newSections[key].rows,
                      seatsPerRow: typeof sectionData.seatsPerRow === 'number' ? sectionData.seatsPerRow : newSections[key].seatsPerRow
                    };
                  }
                });
                setSections(newSections);
              } else {
                if (typeof parsedData.leftRows === 'number' || typeof parsedData.leftSeatsPerRow === 'number') {
                  newSections.left = {
                    enabled: true,
                    rows: typeof parsedData.leftRows === 'number' ? parsedData.leftRows : newSections.left.rows,
                    seatsPerRow: typeof parsedData.leftSeatsPerRow === 'number' ? parsedData.leftSeatsPerRow : newSections.left.seatsPerRow
                  };
                }
                
                if (typeof parsedData.rightRows === 'number' || typeof parsedData.rightSeatsPerRow === 'number') {
                  newSections.right = {
                    enabled: true,
                    rows: typeof parsedData.rightRows === 'number' ? parsedData.rightRows : newSections.right.rows,
                    seatsPerRow: typeof parsedData.rightSeatsPerRow === 'number' ? parsedData.rightSeatsPerRow : newSections.right.seatsPerRow
                  };
                }
                
                if (typeof parsedData.backRows === 'number' || typeof parsedData.backSeatsPerRow === 'number') {
                  newSections.back = {
                    enabled: true,
                    rows: typeof parsedData.backRows === 'number' ? parsedData.backRows : newSections.back.rows,
                    seatsPerRow: typeof parsedData.backSeatsPerRow === 'number' ? parsedData.backSeatsPerRow : newSections.back.seatsPerRow
                  };
                }
                
                setSections(newSections);
              }
              
              if (parsedData.rowLabels && typeof parsedData.rowLabels === 'object') {
                setRowLabels(parsedData.rowLabels);
              }

              if (parsedData.sectionNumberingStyles && typeof parsedData.sectionNumberingStyles === 'object') {
                setSectionNumberingStyles(parsedData.sectionNumberingStyles);
              } else if (typeof parsedData.numberingStyle === 'string') {
                const style = parsedData.numberingStyle as 'arabic' | 'roman' | 'letters';
                setSectionNumberingStyles({
                  main: style,
                  left: style,
                  right: style,
                  back: style,
                  back1: style,
                  back2: style,
                  left1: style,
                  left2: style,
                  right1: style,
                  right2: style
                });
              }

              if (parsedData.sectionNames && typeof parsedData.sectionNames === 'object') {
                setSectionNames(mergeWithDefaultSectionNames(parsedData.sectionNames));
              }
              
              if (parsedData.emptyRows && typeof parsedData.emptyRows === 'object') {
                const convertedEmptyRows: Record<string, Set<number>> = {};
                Object.entries(parsedData.emptyRows).forEach(([section, rows]) => {
                  if (Array.isArray(rows)) {
                    convertedEmptyRows[section] = new Set<number>(rows);
                  }
                });
                setEmptyRows(convertedEmptyRows);
              }

              if (parsedData.removedSeats && typeof parsedData.removedSeats === 'object') {
                const convertedRemovedSeats: Record<string, Record<number, Set<number>>> = {};
                Object.entries(parsedData.removedSeats).forEach(([section, rows]) => {
                  if (typeof rows === 'object' && rows !== null) {
                    convertedRemovedSeats[section] = {};
                   Object.entries(rows as Record<string, any>).forEach(([rowIndex, seats]) => {
                     if (Array.isArray(seats)) {
                       convertedRemovedSeats[section][Number(rowIndex)] = new Set(seats);
                      }
                    });
                  }
                });
                setRemovedSeats(convertedRemovedSeats);
              }
              
              if (parsedData.rowSeatsPerRow && typeof parsedData.rowSeatsPerRow === 'object') {
                const convertedRowSeatsPerRow: Record<string, Record<number, number>> = {};
                Object.entries(parsedData.rowSeatsPerRow).forEach(([section, rows]) => {
                  if (typeof rows === 'object' && rows !== null) {
                    convertedRowSeatsPerRow[section] = {};
                    Object.entries(rows as Record<string, any>).forEach(([rowIndex, seats]) => {
                      if (typeof seats === 'number') {
                        convertedRowSeatsPerRow[section][Number(rowIndex)] = seats;
                      }
                    });
                  }
                });
                setRowSeatsPerRow(convertedRowSeatsPerRow);
              }

              if (parsedData.numberingDirections && typeof parsedData.numberingDirections === 'object') {
                setNumberingDirections(parsedData.numberingDirections);
              }
              
              if (parsedData.rowAlignments && typeof parsedData.rowAlignments === 'object') {
                setRowAlignments(parsedData.rowAlignments);
              }
              
              if (parsedData.sectionAlignments && typeof parsedData.sectionAlignments === 'object') {
                setSectionAlignments(parsedData.sectionAlignments);
              }
            } catch (e) {
              console.error('Error parsing layout data:', e);
              toast.error('Błąd podczas wczytywania planu sali');
            }
          }
          setLayoutData(layoutData);
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

  const handleSave = async () => {
    try {
      setSaving(true);

      const serializedRemovedSeats: Record<string, Record<number, number[]>> = {};
      Object.entries(removedSeats).forEach(([section, rows]) => {
        if (Object.keys(rows).length > 0) {
          serializedRemovedSeats[section] = {};
          Object.entries(rows).forEach(([rowIndex, seats]) => {
            serializedRemovedSeats[section][Number(rowIndex)] = Array.from(seats);
          });
        }
      });
     
      const serializedEmptyRows: Record<string, number[]> = {};
      Object.entries(emptyRows).forEach(([section, rows]) => {
        if (rows.size > 0) {
          serializedEmptyRows[section] = Array.from(rows);
        }
      });
      
      const serializedRowSeatsPerRow = { ...rowSeatsPerRow };

      const sectionData = {
        sections,
        sectionNumberingStyles,
        rowLabels,
        sectionNames,
        removedSeats: serializedRemovedSeats,
        emptyRows: serializedEmptyRows,
        rowSeatsPerRow: serializedRowSeatsPerRow,
        numberingDirections,
        rowAlignments,
        sectionAlignments
      };
      
      if (layoutData) {
        const { error } = await supabase
          .from('hall_layouts')
          .update({
            rows: sections.main.rows,
            seats_per_row: sections.main.seatsPerRow,
            layout_data: sectionData,
            total_seats: totalSeats,
            updated_at: new Date().toISOString()
          })
          .eq('id', layoutData.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hall_layouts')
          .insert({
            hall_id: hallId,
            name: hallName,
            rows: sections.main.rows,
            seats_per_row: sections.main.seatsPerRow,
            layout_data: sectionData,
            total_seats: totalSeats,
            active: true
          });
          
        if (error) throw error;
      }
      
      toast.success('Plan sali został zapisany');
    } catch (error) {
      console.error('Failed to save hall layout:', error);
      toast.error('Nie udało się zapisać planu sali');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSection = (section: 'main' | 'left' | 'right' | 'back' | 'back1' | 'back2' | 'left1' | 'left2' | 'right1' | 'right2') => {
    if (!sections[section]) {
      console.warn(`Section "${section}" does not exist in the sections configuration`);
      return;
    }
    
    if (sections[section].enabled) {
      setSelectedSection(section === selectedSection ? null : section);
    }
  };

  const toggleSection = (section: 'main' | 'left' | 'right' | 'back' | 'back1' | 'back2' | 'left1' | 'left2' | 'right1' | 'right2') => {
    if (section === 'main') return;
    
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const updateSectionConfig = (section: string, field: 'rows' | 'seatsPerRow', value: number) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateSectionNumberingStyle = (section: string, style: 'arabic' | 'roman' | 'letters') => {
    setSectionNumberingStyles(prev => ({
      ...prev,
      [section]: style
    }));
  };

  const handleEditRowLabel = (rowIndex: number, label: string) => {
    if (!selectedSection) return;
    
    setRowLabels(prev => {
      const sectionLabels = { ...prev[selectedSection] };
      
      if (label.trim() === '') {
        delete sectionLabels[rowIndex];
      } else {
        sectionLabels[rowIndex] = label;
      }
      
      return {
        ...prev,
        [selectedSection]: sectionLabels
      };
    });
  };

  const handleSectionNameChange = (section: string, name: string) => {
    setSectionNames(prev => ({
      ...prev,
      [section]: name
    }));
    setShowSectionNameModal(false);
    setSectionToEdit(null);
  };
  
  const openSectionNameModal = (section: string) => {
    setSectionToEdit(section);
    setShowSectionNameModal(true);
  };
  
  const handleUpdateRowSeats = (rowIndex: number, seats: number) => {
    if (!selectedRow || !selectedSection) return;
    
    setRowSeatsPerRow(prev => {
      const newRowSeatsPerRow = { ...prev };
      
      if (!newRowSeatsPerRow[selectedSection]) {
        newRowSeatsPerRow[selectedSection] = {};
      }
      
      newRowSeatsPerRow[selectedSection][rowIndex] = seats;
      
      return newRowSeatsPerRow;
    });
    
    setShowRowSeatsModal(false);
    setSelectedRow(null);
  };
  
  const openRowSeatsModal = (section: string, rowIndex: number) => {
    const rowLabel = rowLabels[section]?.[rowIndex] || getRowLabel(rowIndex, section as any);
    
    const currentSeats = rowSeatsPerRow[section]?.[rowIndex] !== undefined
      ? rowSeatsPerRow[section][rowIndex]
      : sections[section].seatsPerRow;
    
    setSelectedRow({
      section,
      rowIndex,
      rowLabel
    });
    setShowRowSeatsModal(true);
  };
  
const handleRemoveSeat = (section: string, rowIndex: number, seatIndex: number) => {
  setRemovedSeats(prev => {
    const newRemovedSeats = { ...prev };

    if (!newRemovedSeats[section]) {
      newRemovedSeats[section] = {};
    }

    if (!newRemovedSeats[section][rowIndex]) {
      newRemovedSeats[section][rowIndex] = new Set<number>();
    }

    const seatSet = newRemovedSeats[section][rowIndex];

    if (seatSet.has(seatIndex)) {
      seatSet.delete(seatIndex); // ✅ przywraca
    } else {
      seatSet.add(seatIndex); // ❌ usuwa
    }

    return newRemovedSeats;
  });
};

  const handleAddEmptyRow = (section: string, afterRowIndex: number) => {
    setEmptyRows(prev => {
      const newEmptyRows = { ...prev };
      
      if (!newEmptyRows[section]) {
        newEmptyRows[section] = new Set<number>();
      }
      
      const aisleIndex = afterRowIndex + 0.5;
      if (newEmptyRows[section].has(aisleIndex)) {
        newEmptyRows[section].delete(aisleIndex);
      } else {
        newEmptyRows[section].add(aisleIndex);
      }
      
      return newEmptyRows;
    });
  };

  const toggleNumberingDirection = (section: string) => {
    setNumberingDirections(prev => ({
      ...prev,
      [section]: prev[section] === 'ltr' ? 'rtl' : 'ltr'
    }));
  };
  
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 space-y-4 flex flex-col">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">Powrót</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hallName} <span className="text-sm font-normal text-gray-500">({totalSeats} miejsc)</span>
                <span className="ml-2 text-sm font-normal text-gray-500">{hallCity} - {hallAddress}</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <button
    onClick={resetLayout}
    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
  >
    <RotateCcw className="w-5 h-5" />
    <span>Resetuj plan</span>
  </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Podgląd wydruku</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Zapisywanie...' : 'Zapisz plan'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 overflow-visible">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Konfiguracja planu sali
            </h2>
            
            <button
              onClick={() => setShowSectionConfig(!showSectionConfig)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1.5 ml-2"
            >
              <Settings className="w-4 h-4" />
              <span>Konfiguruj sekcje</span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {Object.entries(sections)
              .filter(([_, config]) => config.enabled)
              .map(([sectionKey, _]) => (
                <button
                  key={sectionKey}
                  onClick={() => {
                    setSelectedSection(sectionKey as any);
                    setDrawerOpen(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    selectedSection === sectionKey 
                      ? 'bg-blue-600 text-white' 
                      : sectionKey === 'main'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : sectionKey.startsWith('left')
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : sectionKey.startsWith('right')
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{sectionNames[sectionKey]}</span>
                </button>
              ))}
          </div>
          <LayoutConfigDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>      
          {!showSectionConfig && selectedSection && (
            <>
              <div className="flex flex-col items-start gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    Sekcja: <span className="text-red-600 font-bold">{sectionNames[selectedSection]}</span>
                  </span>
                  <button
                    onClick={() => openSectionNameModal(selectedSection)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Edytuj nazwę sekcji"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba rzędów
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.max(1, sections[selectedSection].rows - 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections[selectedSection].rows}
                      onChange={(e) => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-12 text-center py-1 text-sm border-y border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.min(50, sections[selectedSection].rows + 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRenumberRows(selectedSection)}
                      className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Ponumeruj ponownie rzędy"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miejsca w rzędzie
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.max(1, sections[selectedSection].seatsPerRow - 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections[selectedSection].seatsPerRow}
                      onChange={(e) => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-12 text-center py-1 text-sm border-y border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.min(50, sections[selectedSection].seatsPerRow + 1)
                      )}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                   <button
  type="button"
  onClick={() => setAutoRenumberSeats(prev => !prev)}
  className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2
    ${autoRenumberSeats ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'}
  `}
  title="Ponumeruj miejsca w rzędach"
>
  <ListOrdered className="w-4 h-4" />
  {autoRenumberSeats ? 'Numeruj całość' : 'Pomiń miejsca'}
</button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Styl numeracji rzędów dla {sectionNames[selectedSection]}
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'arabic')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'arabic' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>1, 2, 3</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'roman')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'roman' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>I, II, III</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'letters')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'letters' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>A, B, C</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kierunek numeracji
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleNumberingDirection(selectedSection)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border text-sm text-gray-700"
                  >
                    {numberingDirections[selectedSection] === 'ltr' ? 'Od lewej do prawej' : 'Od prawej do lewej'}
                  </button>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wyrównanie miejsc w sekcji
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'left'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'left' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Do lewej</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'center'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'center' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Do środka</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'right'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'right' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Do prawej</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            
              {selectedSection && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Konfiguracja miejsc w rzędach
                  </h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {Array.from({ length: sections[selectedSection].rows }).map((_, rowIndex) => {
                      if (emptyRows[selectedSection]?.has(rowIndex)) return null;
                      
                      const rowLabel = rowLabels[selectedSection]?.[rowIndex] || getRowLabel(rowIndex, selectedSection as any);
                      
                      const currentSeats = rowSeatsPerRow[selectedSection]?.[rowIndex] !== undefined
                        ? rowSeatsPerRow[selectedSection][rowIndex]
                        : sections[selectedSection].seatsPerRow;
                      
                      return (
                        <div 
                          key={rowIndex}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-gray-100"
                        >
                          <div className="flex items-center">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                              {rowLabel}
                            </span>
                            <span className="ml-3 text-sm text-gray-600">
                              {currentSeats} {currentSeats === 1 ? 'miejsce' : currentSeats < 5 ? 'miejsca' : 'miejsc'}
                            </span>
                            <div className="ml-auto flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setRowAlignments(prev => {
                                    const newAlignments = { ...prev };
                                    if (!newAlignments[selectedSection]) {
                                      newAlignments[selectedSection] = {};
                                    }
                                    newAlignments[selectedSection][rowIndex] = 'left';
                                    return newAlignments;
                                  });
                                }}
                                className={`p-1 rounded ${
                                  rowAlignments[selectedSection]?.[rowIndex] === 'left' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Wyrównaj do lewej"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="17" y1="10" x2="3" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="17" y1="18" x2="3" y2="18"></line>
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setRowAlignments(prev => {
                                    const newAlignments = { ...prev };
                                    if (!newAlignments[selectedSection]) {
                                      newAlignments[selectedSection] = {};
                                    }
                                    newAlignments[selectedSection][rowIndex] = 'center';
                                    return newAlignments;
                                  });
                                }}
                                className={`p-1 rounded ${
                                  rowAlignments[selectedSection]?.[rowIndex] === 'center' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Wyrównaj do środka"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="10" x2="6" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="18" y1="18" x2="6" y2="18"></line>
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setRowAlignments(prev => {
                                    const newAlignments = { ...prev };
                                    if (!newAlignments[selectedSection]) {
                                      newAlignments[selectedSection] = {};
                                    }
                                    newAlignments[selectedSection][rowIndex] = 'right';
                                    return newAlignments;
                                  });
                                }}
                                className={`p-1 rounded ${
                                  rowAlignments[selectedSection]?.[rowIndex] === 'right' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Wyrównaj do prawej"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="21" y1="10" x2="7" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="21" y1="18" x2="7" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => openRowSeatsModal(selectedSection, rowIndex)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            Edytuj
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          </LayoutConfigDrawer>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-md border border-gray-200 p-4">
          
          <div className="w-full min-w-[1200px] min-h-[1200px] bg-white rounded-xl p-4 overflow-auto scrollbar-de" styhile={{ height: 'calc(100vh - 320px)', width: '1600px' }}>
            <HallLayoutGrid 
              sections={sections}
              sectionNumberingStyles={sectionNumberingStyles}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              rowLabels={rowLabels}
              sectionNames={sectionNames}
              onSectionNameChange={handleSectionNameChange}
              onRemoveSeat={handleRemoveSeat}
              removedSeats={removedSeats}
              rowSeatsPerRow={rowSeatsPerRow}
              emptyRows={emptyRows}
              onAddEmptyRow={handleAddEmptyRow}
              numberingDirections={numberingDirections}
             sectionAlignments={sectionAlignments}
             rowAlignments={rowAlignments}
              autoRenumberSeats={autoRenumberSeats}
            />
          </div>
          <div className="text-center mt-4 text-gray-500">
            <p>Edytor planu sali</p>
          </div>
        </div>
      </div>
      
      {showPrintPreview && (
        <PrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          hallName={hallName}
          hallAddress={hallAddress}
          hallCity={hallCity}
          totalSeats={totalSeats}
          sections={sections}
          sectionNames={sectionNames}
          numberingDirections={numberingDirections}
          sectionNumberingStyles={sectionNumberingStyles}
          removedSeats={removedSeats}
          emptyRows={emptyRows}
          rowLabels={rowLabels}
          rowSeatsPerRow={rowSeatsPerRow}
          sectionAlignments={sectionAlignments}
          rowAlignments={rowAlignments}
          orientation={hallName.length > 15 ? 'landscape' : 'portrait'}
        />
      )}

      {selectedRow && (
        <RowSeatsModal
          isOpen={showRowSeatsModal}
          onClose={() => {
            setShowRowSeatsModal(false);
            setSelectedRow(null);
          }}
          sectionName={sectionNames[selectedRow.section]}
          rowIndex={selectedRow.rowIndex}
          rowLabel={selectedRow.rowLabel}
          currentSeats={
            rowSeatsPerRow[selectedRow.section]?.[selectedRow.rowIndex] !== undefined
              ? rowSeatsPerRow[selectedRow.section][selectedRow.rowIndex]
              : sections[selectedRow.section].seatsPerRow
          }
          onConfirm={handleUpdateRowSeats}
        />
      )}
      
      {sectionToEdit && (
        <SectionNameEditModal
          isOpen={showSectionNameModal}
          onClose={() => {
            setShowSectionNameModal(false);
            setSectionToEdit(null);
          }}
          onSave={(name) => handleSectionNameChange(sectionToEdit, name)}
          currentName={sectionNames[sectionToEdit]}
          sectionKey={sectionToEdit}
        />
      )}
      
      <SectionOverviewModal
        isOpen={showSectionConfig}
        onClose={() => setShowSectionConfig(false)}
        sections={sections}
        sectionNames={sectionNames}
        sectionNumberingStyles={sectionNumberingStyles}
        numberingDirections={numberingDirections}
        toggleSection={toggleSection}
        updateSectionConfig={updateSectionConfig}
        updateSectionNumberingStyle={updateSectionNumberingStyle}
        toggleNumberingDirection={toggleNumberingDirection}
        openSectionNameModal={openSectionNameModal}
      />
    </div>
  );
};

export default HallLayout;