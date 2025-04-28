import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, Users, ArrowLeft, Clock, Pencil, Building2, UserIcon, Phone, Mail, Eye, Printer, Trash2, Theater, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import HallSelectionModal from './HallSelectionModal';
import { getCalendars } from '../../services/calendar';
import { getUsers } from '../../services/auth';
import NotificationManager from '../notifications/NotificationManager';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import { EVENT_STATUSES } from '../../utils/statusConstants';
import SeatAssignmentModal from './SeatAssignmentModal'; 
import { extractAssignmentsFromLayoutBlocks } from '../../utils/hall_layout_utils';
import { Calendar, CalendarEvent, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isValidUUID } from '../../utils/validationUtils';

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Improved URL parameter handling with validation
  const [calendarName, date] = useMemo(() => {
    if (!id) return [null, null];
    
    try {
      // First, split by the last underscore to handle calendar names that might contain underscores
      const lastUnderscoreIndex = id.lastIndexOf('_');
      if (lastUnderscoreIndex === -1) return [null, null];
      
      const encodedName = id.substring(0, lastUnderscoreIndex);
      const encodedDate = id.substring(lastUnderscoreIndex + 1);
      
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
  }, [id]);
  
  const [event, setEvent] = useState<CalendarEvent | null>(null);
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
  const [agreements, setAgreements] = useState<any[]>([]);
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
  const performancesByTime = performances.reduce((acc, performance) => {
    const time = performance.performance_time;
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(performance);
    return acc;
  }, {} as Record<string, typeof performances>);
  
  // Sort times chronologically
  const sortedTimes = Object.keys(performancesByTime).sort();

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
  
  const getLayoutBlocks = useCallback(() => {
    if (!event || !event.layout_blocks) return null;
    
    // Ensure layout_blocks is an array
    const layoutBlocksArray = Array.isArray(event.layout_blocks) ? event.layout_blocks : [event.layout_blocks];
    
    // Find the seat_assignments block
    const seatAssignmentsBlock = layoutBlocksArray.find(block => block && block.type === 'seat_assignments');
      
    return seatAssignmentsBlock;
  }, [event]);
  
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
  
  const handleAssignSeats = (performance: any) => {
    setSelectedPerformance(performance);
    const schoolName = agreementsByPerformance[performance.id]?.school_name || '';
    setSchoolAssignments(getSchoolAssignments(schoolName));
    setShowSeatAssignmentModal(true);
  };

  // Function to load hall layout data
  const loadHallLayoutData = async () => {
    if (!event || !event.hall_id) return;
    
    try {
      const { data: hallLayout, error } = await supabase
        .from('hall_layouts')
        .select('layout_data')
        .eq('hall_id', event.hall_id)
        .single();
        
      if (error) throw error;
      
      if (hallLayout?.layout_data && (!event.layout_blocks || event.layout_blocks.length === 0)) {
        // Update event with hall layout data
        const { error: updateError } = await supabase
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
          
        if (updateError) throw updateError;
        
        // Reload event data
        window.location.reload();
      }
    } catch (err) {
      console.error('Error loading hall layout data:', err);
    }
  };
  
  // Load hall layout data when event changes
  useEffect(() => {
    loadHallLayoutData();
  }, [event?.hall_id]);

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
            .eq('active', true)
            .eq('current_season', true)
        ]);

        const foundCalendar = calendars.find(cal => cal.name === calendarName);
        if (!foundCalendar) {
          throw new Error(`Nie znaleziono kalendarza o nazwie "${calendarName}"`);
        }

        const formattedDate = eventDate.toISOString().split('T')[0];

        const foundEvent = foundCalendar.events.find(e => 
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
          .eq('performance_date', formattedDate)
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

        setEvent(foundEvent);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col items-center text-center">
            <div className="text-red-700 mb-2 font-medium">{error}</div>
            <div className="text-gray-600 text-sm">Przekierowywanie do listy wydarzeń...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <div className="flex flex-col items-center text-center">
            <div className="font-medium mb-2">Nie znaleziono wydarzenia o podanym identyfikatorze</div>
            <div className="text-gray-600 text-sm">Sprawdź poprawność adresu URL</div>
          </div>
        </div>
      </div>
    );
  }

  const assignedUser = users.find(u => u.id === event.userId);
  const statusInfo = EVENT_STATUSES[event.status];
  const isCurrentUserEvent = currentUser?.id === event.userId;
  const isSupervisorOrganizer = Boolean(currentUser?.role === 'supervisor' && 
    assignedUser?.role === 'organizator' &&
    (currentUser.organizatorIds?.includes(assignedUser.id) || assignedUser?.supervisorId === currentUser.id));

  return (
    <div className="w-full max-w-6xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Powrót</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 sm:p-6">
          <div className="text-white">
            <div className="flex justify-between items-start">
              <h1 className="text-xl sm:text-2xl font-bold mb-4">Szczegóły wydarzenia</h1>
              {event.city && (
                <button
                  onClick={() => {
                    setSmsRecipients([{
                      id: event.id,
                      name: assignedUser?.name || '',
                      phone: '123456789',
                      phoneType: 'k',
                      eventDate: event.date.toISOString(),
                      title: showTitles.find(t => t.id === performances[0]?.show_title_id)?.name || '',
                      eventCity: event.city.name,
                      tickets: '0'
                    }]);
                    setShowSmsForm(true);
                  }}
                  className="px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Wyślij SMS
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color}`} />
                <span>{statusInfo.label}</span>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <CalendarIcon className="w-5 h-5 text-white/70" />
                <span>{calendar?.name}</span>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <CalendarIcon className="w-5 h-5 text-white/70" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <MapPin className="w-5 h-5 text-white/70" />
                <span>
                  {event.city ? `${event.city.name}, ${event.city.voivodeship}` : 'Brak miasta'}
                  <button
                    onClick={() => setShowHallSelectionModal(true)}
                    className="ml-2 px-2 py-0.5 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                  >
                    {event.city ? 'Zmień salę' : 'Wybierz salę'}
                  </button>
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Users className="w-5 h-5 text-white/70" />
                <span className={`${isCurrentUserEvent ? 'font-bold' : ''} ${isSupervisorOrganizer ? 'text-blue-200' : ''}`}>
                  {assignedUser?.name || 'Brak przypisania'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Spektakle</h3>
            
            {performances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak spektakli przypisanych do tego wydarzenia
              </div>
            ) : (
              <div className="space-y-8">
                {sortedTimes.map(time => {
                  const timePerformances = performancesByTime[time];
                  const showTitleName = timePerformances[0]?.show_titles?.name || 'Nieznany spektakl';
                  
                  return (
                    <div key={time} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-gray-500 mr-2" />
                          <h4 className="text-lg font-medium text-gray-900">
                            {time.substring(0, 5)} - {showTitleName}
                          </h4>
                        </div>
                        
                        {event.city && (
                          <div className="flex gap-2">
                           <button
                             onClick={() => {
                               const performances = timePerformances;
                               const firstPerformance = performances[0];
                               setSelectedPerformance(firstPerformance);
                               const schoolNames = performances.map(p => 
                                 agreementsByPerformance[p.id]?.school_name || ''
                               ).filter(Boolean);
                               const allAssignments: Record<string, string> = {};
                               schoolNames.forEach(schoolName => {
                                 const schoolAssignments = getSchoolAssignments(schoolName);
                                 Object.entries(schoolAssignments).forEach(([seatId, school]) => {
                                   allAssignments[seatId] = school;
                                 });
                               });
                               setSchoolAssignments(allAssignments);
                               setShowSeatAssignmentModal(true);
                             }}
                             className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors flex items-center gap-1.5"
                           >
                             <MapPin className="w-4 h-4" />
                             <span>Przypisz miejsca dla wszystkich szkół</span>
                           </button>
                         </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-12 gap-1 font-medium text-gray-700 text-sm mb-3 px-2">
                          <div className="col-span-4">Szkoła</div>
                          <div className="col-span-3">Nauczyciel</div>
                          <div className="col-span-1 text-center">Płatne</div>
                          <div className="col-span-1 text-center">Bezpł.</div>
                          <div className="col-span-3">Uwagi</div>
                        </div>
                        
                        <div className="space-y-2">
                          {timePerformances.map(performance => (
                            <div 
                              key={`perf-${performance.id}`}
                              className="bg-white rounded-lg py-2 px-3 border border-gray-100 hover:border-red-200 transition-all hover:shadow-sm"
                            >
                              <div className="grid grid-cols-12 gap-1 items-center text-sm">
                                <div className="col-span-4">
                                  <p className="text-gray-900 font-medium truncate">
                                    {agreementsByPerformance[performance.id]?.school_name}
                                  </p>
                                </div>
                                <div className="col-span-3">
                                  <p className="text-gray-700 truncate">
                                    {agreementsByPerformance[performance.id]?.teacher_name}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {agreementsByPerformance[performance.id]?.teacher_phone}
                                  </p>
                                </div>
                                <div className="col-span-1 text-center text-gray-900">
                                  {performance.paid_tickets}
                                </div>
                                <div className="col-span-1 text-center text-gray-900">
                                  {performance.unpaid_tickets + performance.teacher_tickets}
                                  <div className="text-xs text-gray-500">
                                    ({performance.teacher_tickets} naucz.)
                                  </div>
                                </div>
                                <div className="col-span-2 text-gray-600 truncate" title={performance.notes || ''}>
                                  {performance.notes || '-'}
                                </div>
                                <div className="col-span-1 flex justify-end gap-1 items-center">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleAssignSeats(performance)}
                                      className="p-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                                      title={`Przypisz miejsca dla szkoły: ${agreementsByPerformance[performance.id]?.school_name || ''}`}
                                    >
                                      <MapPin className="w-3 h-3" />
                                      <span>Miejsca ({countAssignedSeats(agreementsByPerformance[performance.id]?.school_name || '')})</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 border-t border-gray-200">
                        <div className="flex justify-end text-sm text-gray-600">
                          <span className="font-medium text-gray-700">
                            Łącznie biletów: {timePerformances.reduce((sum, p) => sum + p.paid_tickets + p.unpaid_tickets + p.teacher_tickets, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-end items-center space-x-2">
                    <div className="text-sm font-medium text-gray-800">
                      Łącznie biletów: {performances.reduce((sum, p) => sum + p.paid_tickets + p.unpaid_tickets + p.teacher_tickets, 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSeatAssignmentModal && selectedPerformance && event && (
        <SeatAssignmentModal
          isOpen={showSeatAssignmentModal}
          onClose={() => {
            setShowSeatAssignmentModal(false);
            setSelectedPerformance(null);
          }}
          eventId={event.id}
          performance={selectedPerformance}
          schoolName={agreementsByPerformance[selectedPerformance.id]?.school_name || ''}
          layoutBlocks={event.layout_blocks}
          initialAssignments={schoolAssignments}
          onSave={async (newAssignments) => {
            try {
              // Get current layout blocks
              const layoutBlocks = [...(Array.isArray(event?.layout_blocks) ? event.layout_blocks : [])];
              const seatAssignmentsIndex = layoutBlocks.findIndex(block => block.type === 'seat_assignments');
              
              if (seatAssignmentsIndex >= 0) {
                const schoolName = agreementsByPerformance[selectedPerformance.id]?.school_name || '';
                const currentAssignments = {...layoutBlocks[seatAssignmentsIndex].assignments};
                
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
                  .update({ layout_blocks: newLayoutBlocks })
                  .eq('id', event.id);
                  
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
          }}
        />
      )}
      
      {showSmsForm && (
        <NotificationManager
          pendingTransfers={[]}
          currentTransfer={null}
          users={users}
          currentUser={currentUser}
          showNotification={false}
          onClose={() => {}}
          onViewTransfers={() => {}}
          onAccept={() => {}}
          onReject={() => {}}
          showSmsForm={showSmsForm}
          smsRecipients={smsRecipients}
          onCloseSmsForm={() => setShowSmsForm(false)}
        />
      )}

      <HallSelectionModal
        isOpen={showHallSelectionModal}
        onClose={() => setShowHallSelectionModal(false)}
        eventId={event.id}
        currentCityId={event.city?.id}
        onHallSelected={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default EventDetails;