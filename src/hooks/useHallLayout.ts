import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  SectionConfig, 
  SectionType,
  mergeWithDefaultSectionNames,
  getRowLabel,
  calculateTotalSeats
} from '../utils/hallLayoutUtils';
import { getDefaultLayoutState } from '../utils/HallLayoutResetUtil';
import { sanitizeLayoutBlocks } from '../utils/hall_layout_utils';

interface HallProps {
  hallId?: string;
}

interface HallData {
  name: string;
  city: string;
  address: string;
  layout_data: any;
}

export const useHallLayout = ({ hallId }: HallProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hallName, setHallName] = useState('');
  const [hallCity, setHallCity] = useState('');
  const [hallAddress, setHallAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [totalSeats, setTotalSeats] = useState(0);
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

  // State for hall configuration
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
  
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
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

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    if (!window.confirm('Czy na pewno chcesz zresetować plan sali? Ta operacja jest nieodwracalna.')) return;

    const defaultState = getDefaultLayoutState();
    
    setSections(defaultState.sections);
    setSectionNumberingStyles(defaultState.sectionNumberingStyles);
    setRowLabels(defaultState.rowLabels);
    setEmptyRows(defaultState.emptyRows);
    setRemovedSeats(defaultState.removedSeats);
    setRowSeatsPerRow(defaultState.rowSeatsPerRow);
    setNumberingDirections(defaultState.numberingDirections);
    setSectionNames(defaultState.sectionNames);
    setRowAlignments(defaultState.rowAlignments);
    setSectionAlignments(defaultState.sectionAlignments);
    
    toast.success('Plan sali został zresetowany do ustawień domyślnych');
  }, []);

  // Update total seats count
  useEffect(() => {
    const count = calculateTotalSeats(sections, emptyRows, removedSeats);
    setTotalSeats(count);
  }, [sections, emptyRows, removedSeats]);

  // Load hall data
  useEffect(() => {
    const loadHallData = async () => {
      if (!hallId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('halls')
          .select('*')
          .eq('id', hallId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Nie znaleziono sali');
        }

        const hallData = data as HallData;
        
        setHallName(hallData.name);
        setHallCity(hallData.city);
        setHallAddress(hallData.address);

        if (hallData.layout_data) {
          setLayoutData(hallData.layout_data);
          
          if (hallData.layout_data.sections) {
            setSections(hallData.layout_data.sections);
          }
          
          if (hallData.layout_data.sectionNumberingStyles) {
            setSectionNumberingStyles(hallData.layout_data.sectionNumberingStyles);
          }
          
          if (hallData.layout_data.rowLabels) {
            setRowLabels(hallData.layout_data.rowLabels);
          }
          
          if (hallData.layout_data.emptyRows) {
            // Convert array back to Set for each section
            const emptyRowsObj: Record<string, Set<number>> = {};
            Object.entries(hallData.layout_data.emptyRows).forEach(([section, rows]) => {
              emptyRowsObj[section] = new Set(rows as number[]);
            });
            setEmptyRows(emptyRowsObj);
          }
          
          if (hallData.layout_data.removedSeats) {
            // Convert arrays back to Set for each row in each section
            const removedSeatsObj: Record<string, Record<number, Set<number>>> = {};
            Object.entries(hallData.layout_data.removedSeats).forEach(([section, rows]) => {
              removedSeatsObj[section] = {};
              Object.entries(rows as Record<string, number[]>).forEach(([rowIdx, seats]) => {
                const rowIndex = parseInt(rowIdx);
                removedSeatsObj[section][rowIndex] = new Set(seats);
              });
            });
            setRemovedSeats(removedSeatsObj);
          }
          
          if (hallData.layout_data.rowSeatsPerRow) {
            setRowSeatsPerRow(hallData.layout_data.rowSeatsPerRow);
          }
          
          if (hallData.layout_data.numberingDirections) {
            setNumberingDirections(hallData.layout_data.numberingDirections);
          }
          
          if (hallData.layout_data.sectionNames) {
            setSectionNames(mergeWithDefaultSectionNames(hallData.layout_data.sectionNames));
          }
          
          if (hallData.layout_data.rowAlignments) {
            setRowAlignments(hallData.layout_data.rowAlignments);
          }
          
          if (hallData.layout_data.sectionAlignments) {
            setSectionAlignments(hallData.layout_data.sectionAlignments);
          }
        }
      } catch (err) {
        console.error('Error loading hall data:', err);
        setError('Błąd podczas ładowania danych sali');
      } finally {
        setLoading(false);
      }
    };

    loadHallData();
  }, [hallId]);

  // Save hall data
  const handleSave = async () => {
    if (!hallId) {
      toast.error('Brak identyfikatora sali');
      return;
    }

    setSaving(true);

    try {
      // Prepare data for saving
      const preparedEmptyRows: Record<string, number[]> = {};
      Object.entries(emptyRows).forEach(([section, rowsSet]) => {
        preparedEmptyRows[section] = Array.from(rowsSet);
      });

      const preparedRemovedSeats: Record<string, Record<string, number[]>> = {};
      Object.entries(removedSeats).forEach(([section, rows]) => {
        preparedRemovedSeats[section] = {};
        Object.entries(rows).forEach(([rowIdx, seatsSet]) => {
          preparedRemovedSeats[section][rowIdx] = Array.from(seatsSet);
        });
      });

      const layoutDataToSave = {
        sections,
        sectionNumberingStyles,
        rowLabels,
        emptyRows: preparedEmptyRows,
        removedSeats: preparedRemovedSeats,
        rowSeatsPerRow,
        numberingDirections,
        sectionNames,
        rowAlignments,
        sectionAlignments
      };

      const { error } = await supabase
        .from('halls')
        .update({
          layout_data: layoutDataToSave
        })
        .eq('id', hallId);

      if (error) {
        throw error;
      }

      setLayoutData(layoutDataToSave);
      toast.success('Plan sali został zapisany');
    } catch (err) {
      console.error('Error saving hall layout:', err);
      toast.error('Błąd podczas zapisywania planu sali');
    } finally {
      setSaving(false);
    }
  };

  // Handle sections and rows operations
  const handleSelectSection = (section: SectionType) => {
    setSelectedSection(section);
    setDrawerOpen(true);
  };

  const toggleSection = (section: SectionType) => {
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

  const handleSectionNameChange = (section: string, name: string) => {
    setSectionNames(prev => ({
      ...prev,
      [section]: name
    }));
    setShowSectionNameModal(false);
  };

  const openSectionNameModal = (section: string) => {
    setSectionToEdit(section);
    setShowSectionNameModal(true);
  };

  const handleRenumberSeats = (section: string) => {
    // Implementation of reordering seats in a section
    // ...
  };

  const handleRenumberRows = (section: string) => {
    // Implementation of reordering rows in a section
    // ...
  };

  const toggleNumberingDirection = (section: string) => {
    setNumberingDirections(prev => ({
      ...prev,
      [section]: prev[section] === 'ltr' ? 'rtl' : 'ltr'
    }));
  };

  // Row and seat operations
  const handleRemoveSeat = (section: string, rowIndex: number, seatIndex: number) => {
    setRemovedSeats(prev => {
      const newState = { ...prev };
      
      if (!newState[section]) {
        newState[section] = {};
      }
      
      if (!newState[section][rowIndex]) {
        newState[section][rowIndex] = new Set<number>();
      }
      
      newState[section][rowIndex].add(seatIndex);
      
      return newState;
    });
  };

  const handleAddEmptyRow = (section: string, afterRowIndex: number) => {
    setEmptyRows(prev => {
      const newEmptyRows = { ...prev };
      
      if (!newEmptyRows[section]) {
        newEmptyRows[section] = new Set<number>();
      }
      
      newEmptyRows[section].add(afterRowIndex);
      
      return newEmptyRows;
    });
  };

  const handleUpdateRowSeats = (rowIndex: number, seats: number) => {
    if (!selectedSection) return;
    
    setRowSeatsPerRow(prev => {
      const newState = { ...prev };
      
      if (!newState[selectedSection]) {
        newState[selectedSection] = {};
      }
      
      newState[selectedSection][rowIndex] = seats;
      
      return newState;
    });
    
    setShowRowSeatsModal(false);
  };

  const openRowSeatsModal = (section: string, rowIndex: number) => {
    const style = sectionNumberingStyles[section] || 'arabic';
    const rowLabel = rowLabels[section]?.[rowIndex] || getRowLabel(rowIndex, section, style);
    
    setSelectedRow({
      section,
      rowIndex,
      rowLabel
    });
    
    setShowRowSeatsModal(true);
  };

  const handleEditRowLabel = (rowIndex: number, label: string) => {
    if (!selectedSection) return;
    
    setRowLabels(prev => {
      const newLabels = { ...prev };
      
      if (!newLabels[selectedSection]) {
        newLabels[selectedSection] = {};
      }
      
      newLabels[selectedSection][rowIndex] = label;
      
      return newLabels;
    });
  };

  return {
    // State
    loading,
    error,
    hallName,
    hallCity,
    hallAddress,
    drawerOpen,
    expandedSections,
    sections,
    sectionNumberingStyles,
    saving,
    layoutData,
    selectedSection,
    showSectionConfig,
    rowLabels,
    totalSeats,
    showSectionNameModal,
    sectionToEdit,
    emptyRows,
    showPrintPreview,
    skipRemovedSeatsVisual,
    autoRenumberSeats,
    removedSeats,
    rowSeatsPerRow,
    showRowSeatsModal,
    selectedRow,
    numberingDirections,
    sectionNames,
    rowAlignments,
    sectionAlignments,
    
    // Actions
    setHallName,
    setHallCity,
    setHallAddress,
    setDrawerOpen,
    setExpandedSections,
    setShowSectionConfig,
    setShowPrintPreview,
    setSkipRemovedSeatsVisual,
    setAutoRenumberSeats,
    setSectionAlignments,
    setShowSectionNameModal,
    setShowRowSeatsModal,
    setSectionToEdit,
    
    // Operations
    resetLayout,
    handleSave,
    handleSelectSection,
    toggleSection,
    updateSectionConfig,
    updateSectionNumberingStyle,
    handleSectionNameChange,
    openSectionNameModal,
    handleRenumberSeats,
    handleRenumberRows,
    handleRemoveSeat,
    handleAddEmptyRow,
    handleUpdateRowSeats,
    openRowSeatsModal,
    handleEditRowLabel,
    toggleNumberingDirection,
  };
}; 