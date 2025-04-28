import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getCalendars } from '../services/calendar';
import { getUsers } from '../services/auth';
import { formatDate } from '../utils/dateUtils';
import { Calendar, User } from '../types';
import { ExtendedCalendarEvent, LayoutBlock } from '../types/extendedTypes';
import { extractAssignmentsFromLayoutBlocks } from '../utils/hall_layout_utils';
import { isValidUUID } from '../utils/validationUtils';

interface UseEventDetailsProps {
  eventId: string | undefined;
}

export const useEventDetails = ({ eventId }: UseEventDetailsProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Improved URL parameter handling with validation
  const [calendarName, date] = useMemo(() => {
    if (!eventId) return [null, null];
    
    try {
      // First, split by the last underscore to handle calendar names that might contain underscores
      const lastUnderscoreIndex = eventId.lastIndexOf('_');
      if (lastUnderscoreIndex === -1) return [null, null];
      
      const encodedName = eventId.substring(0, lastUnderscoreIndex);
      const encodedDate = eventId.substring(lastUnderscoreIndex + 1);
      
      if (!encodedName || !encodedDate) return [null, null];
      
      const decodedName = decodeURIComponent(encodedName);
      const decodedDate = decodeURIComponent(encodedDate);
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(decodedDate)) return [null, null];
      
      // Create a UTC date object to avoid timezone issues
      const parsedDate = new Date(decodedDate + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) return [null, null];
      
      return [decodedName.trim(), decodedDate.trim()];
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
      return [null, null];
    }
  }, [eventId]);
  
  // State
  const [event, setEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTitles, setShowTitles] = useState<{ id: string; name: string; current_season: boolean }[]>([]);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [agreementsByPerformance, setAgreementsByPerformance] = useState<Record<string, {
    school_name: string;
    school_address: string;
    teacher_name: string;
    teacher_phone: string;
    teacher_email: string;
  }>>({});
  const [performances, setPerformances] = useState<{
    id: string;
    performance_date: string;
    performance_time: string;
    show_title_id: string;
    paid_tickets: number;
    unpaid_tickets: number;
    teacher_tickets: number;
    cost: number;
    notes: string | null;
    show_titles?: { name: string } | null;
  }[]>([]);
  const [smsRecipients, setSmsRecipients] = useState<{
    id: string;
    name: string;
    phone: string;
    phoneType: 'k' | 's';
    eventDate: string;
    title: string;
    eventCity: string;
    tickets: string;
  }[]>([]);
  const [showHallSelectionModal, setShowHallSelectionModal] = useState(false);
  const [showSeatAssignmentModal, setShowSeatAssignmentModal] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);
  const [schoolAssignments, setSchoolAssignments] = useState<Record<string, string>>({});

  // Group performances by showtime
  const performancesByTime = useMemo(() => {
    return performances.reduce((acc, performance) => {
      const time = performance.performance_time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(performance);
      return acc;
    }, {} as Record<string, typeof performances>);
  }, [performances]);
  
  // Sort times chronologically
  const sortedTimes = useMemo(() => {
    return Object.keys(performancesByTime).sort();
  }, [performancesByTime]);

  // Get layout blocks from event
  const getLayoutBlocks = useCallback((): LayoutBlock | null => {
    if (!event || !event.layout_blocks) return null;
    
    // Ensure layout_blocks is an array
    const layoutBlocksArray = Array.isArray(event.layout_blocks) ? event.layout_blocks : [event.layout_blocks];
    
    // Find the seat_assignments block
    const seatAssignmentsBlock = layoutBlocksArray.find((block: any) => block && block.type === 'seat_assignments');
      
    return seatAssignmentsBlock || null;
  }, [event]);
  
  // Functions for seat assignments
  const getSchoolAssignments = useCallback((schoolName: string) => {
    const layoutBlock = getLayoutBlocks();
    
    if (!layoutBlock || !layoutBlock.assignments) {
      return {};
    }
    
    const assignments: Record<string, string> = {};
    Object.entries(layoutBlock.assignments).forEach(([seatId, school]) => {
      if (school === schoolName) {
        assignments[seatId] = schoolName;
      }
    });
    
    return assignments;
  }, [getLayoutBlocks]);
  
  const countAssignedSeats = useCallback((schoolName: string) => {
    const assignments = getSchoolAssignments(schoolName);
    return Object.keys(assignments).length;
  }, [getSchoolAssignments]);
  
  // Handlers
  const handleTimeChange = useCallback((index: number, time: string) => {
    setPerformances(prev => prev.map((p, i) => 
      i === index ? { ...p, performance_time: time } : p
    ));
  }, []);

  const handleTitleChange = useCallback((index: number, titleId: string) => {
    setPerformances(prev => prev.map((p, i) => 
      i === index ? { ...p, show_title_id: titleId } : p
    ));
  }, []);
  
  const handleAssignSeats = useCallback((performance: any) => {
    setSelectedPerformance(performance);
    const schoolName = agreementsByPerformance[performance.id]?.school_name || '';
    setSchoolAssignments(getSchoolAssignments(schoolName));
    setShowSeatAssignmentModal(true);
  }, [agreementsByPerformance, getSchoolAssignments]);

  // Function to load hall layout data
  const loadHallLayoutData = useCallback(async () => {
    if (!event || !event.hall_id) return;
    
    try {
      const { data: hallLayout, error } = await supabase
        .from('hall_layouts')
        .select('layout_data')
        .eq('hall_id', event.hall_id)
        .single();
        
      if (error) throw error;
      
      if (hallLayout && hallLayout.layout_data && (!event.layout_blocks || event.layout_blocks.length === 0)) {
        // Update event with hall layout data
        await supabase
          .from('calendar_events')
          .update({ 
            layout_blocks: [
              {
                type: 'seat_assignments',
                sections: hallLayout.layout_data.sections || {},
                assignments: {},
                schools: []
              }
            ] 
          })
          .eq('id', event.id);
        
        // Reload event data
        window.location.reload();
      }
    } catch (err) {
      console.error('Error loading hall layout data:', err);
    }
  }, [event]);
  
  // Update hall layout data when event changes
  useEffect(() => {
    if (event?.hall_id) {
      loadHallLayoutData();
    }
  }, [event?.hall_id, loadHallLayoutData]);

  // Load event data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Validate URL parameters
        if (!calendarName || !date) {
          throw new Error('Nieprawidłowy identyfikator wydarzenia. Sprawdź poprawność adresu URL.');
        }

        // Validate date format
        const eventDate = new Date(date + 'T00:00:00Z');
        if (isNaN(eventDate.getTime())) {
          throw new Error('Nieprawidłowy format daty w adresie URL.');
        }

        const [calendars, loadedUsers, { data: titles }] = await Promise.all([
          getCalendars(),
          getUsers(),
          supabase
            .from('show_titles')
            .select('id, name, current_season')
            .eq('active', true as any)
            .eq('current_season', true as any)
        ]);

        const foundCalendar = calendars.find(cal => cal.name === calendarName);
        if (!foundCalendar) {
          throw new Error(`Nie znaleziono kalendarza o nazwie "${calendarName}"`);
        }

        const formattedDate = eventDate.toISOString().split('T')[0];

        const foundEvent = (foundCalendar as any).events.find((e: any) => 
          e.date.toISOString().split('T')[0] === formattedDate
        );

        if (!foundEvent) {
          throw new Error(`Nie znaleziono wydarzenia w dniu ${formatDate(eventDate)}`);
        }

        const { data: performances, error: performancesError } = await supabase
          .from('agreement_performances')
          .select(`
            id,
            performance_date,
            performance_time,
            show_title_id,
            paid_tickets,
            unpaid_tickets,
            teacher_tickets,
            cost,
            notes,
            show_titles!inner(name),
            agreements!inner(
              school_name,
              school_address,
              teacher_name,
              teacher_phone,
              teacher_email
            )
          `)
          .eq('performance_date', formattedDate as any)
          .order('performance_time');
        
        if (performancesError) {
          throw performancesError;
        }
        
        const processedPerformances = performances?.map(perf => ({
          id: perf.id,
          performance_date: perf.performance_date,
          performance_time: perf.performance_time,
          show_title_id: perf.show_title_id,
          paid_tickets: perf.paid_tickets,
          unpaid_tickets: perf.unpaid_tickets,
          teacher_tickets: perf.teacher_tickets,
          cost: perf.cost,
          notes: perf.notes,
          show_titles: perf.show_titles,
          agreements: perf.agreements
        })) || [];

        const agreementLookup = performances?.reduce((acc, perf) => ({
          ...acc,
          [perf.id]: perf.agreements
        }), {});

        setPerformances(processedPerformances);
        setAgreementsByPerformance(agreementLookup);
        // Type cast to ExtendedCalendarEvent since we know it contains the extra properties
        setEvent(foundEvent as unknown as ExtendedCalendarEvent);
        setCalendar(foundCalendar);
        setUsers(loadedUsers);
        setShowTitles(titles || []);

      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania danych');
        // Redirect to events list after a short delay if there's an error
        setTimeout(() => {
          navigate('/events');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [calendarName, date, navigate]);

  // Handle saving seat assignments
  const saveSeatAssignments = useCallback(async (newAssignments: Record<string, string>) => {
    if (!event || !selectedPerformance) return;
    
    try {
      // Get current layout blocks
      const layoutBlocks = [...(Array.isArray(event?.layout_blocks) ? event.layout_blocks : [])] as LayoutBlock[];
      const seatAssignmentsIndex = layoutBlocks.findIndex(block => block.type === 'seat_assignments');
      
      if (seatAssignmentsIndex >= 0) {
        const schoolName = agreementsByPerformance[selectedPerformance.id]?.school_name || '';
        const currentAssignments = {...(layoutBlocks[seatAssignmentsIndex].assignments || {})};
        
        // Remove existing assignments for this school
        Object.entries(currentAssignments).forEach(([seatId, school]) => {
          if (school === schoolName) {
            delete currentAssignments[seatId];
          }
        });
        
        // Add new assignments
        Object.entries(newAssignments).forEach(([seatId, school]) => {
          currentAssignments[seatId] = school;
        });
        
        layoutBlocks[seatAssignmentsIndex].assignments = currentAssignments;
        
        // Update the database
        const { error } = await supabase
          .from('calendar_events')
          .update({ 
            layout_blocks: layoutBlocks 
          })
          .eq('id', event.id);
          
        if (error) throw error;
        
        // Update local state
        setEvent({
          ...event,
          layout_blocks: layoutBlocks
        });
        
        toast.success('Przypisania miejsc zostały zapisane');
      } else if (layoutBlocks.length === 0) {
        const newLayoutBlocks = [{
          type: 'seat_assignments',
          assignments: newAssignments || {},
          sections: getLayoutBlocks()?.sections || {},
          schools: []
        }];
        
        const { error } = await supabase
          .from('calendar_events')
          .update({ layout_blocks: newLayoutBlocks } as any)
          .eq('id', event.id as string);
          
        if (error) throw error;
        
        setEvent({
          ...event,
          layout_blocks: newLayoutBlocks
        });
        
        toast.success('Przypisania miejsc zostały zapisane');
      }
      
      // Close the modal
      setShowSeatAssignmentModal(false);
      setSelectedPerformance(null);
    } catch (error) {
      console.error('Failed to save seat assignments:', error);
      toast.error('Nie udało się zapisać przypisań miejsc');
      throw error;
    }
  }, [event, selectedPerformance, agreementsByPerformance]);

  // UI state for the assigned user and status info
  const assignedUser = useMemo(() => users.find(u => u.id === event?.userId), [users, event?.userId]);
  
  const isCurrentUserEvent = useMemo(() => currentUser?.id === event?.userId, [currentUser, event]);
  
  const isSupervisorOrganizer = useMemo(() => {
    return Boolean(
      currentUser?.role === 'supervisor' && 
      assignedUser?.role === 'organizator' &&
      (currentUser.organizatorIds?.includes(assignedUser.id) || assignedUser?.supervisorId === currentUser.id)
    );
  }, [currentUser, assignedUser]);

  return {
    // State
    event: event as unknown as ExtendedCalendarEvent,
    calendar,
    users,
    loading,
    error,
    showTitles,
    showSmsForm,
    agreementsByPerformance,
    performances,
    smsRecipients,
    showHallSelectionModal,
    showSeatAssignmentModal,
    selectedPerformance,
    schoolAssignments,
    performancesByTime,
    sortedTimes,
    assignedUser,
    isCurrentUserEvent,
    isSupervisorOrganizer,
    
    // Actions
    setShowSmsForm,
    setSmsRecipients,
    setShowHallSelectionModal,
    setShowSeatAssignmentModal,
    setSelectedPerformance,
    
    // Handlers
    handleTimeChange,
    handleTitleChange,
    handleAssignSeats,
    saveSeatAssignments,
    getSchoolAssignments,
    countAssignedSeats,
    
    // Navigation
    navigate
  };
}; 