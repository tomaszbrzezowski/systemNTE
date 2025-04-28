import { supabase } from '../../lib/supabase';
import { CalendarEvent } from '../../types';

export const acceptTransfer = async (eventId: string): Promise<void> => {
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (eventError || !event) {
    throw new Error('Event not found');
  }
  
  // Always set status to przekazany for do_przejęcia events
  const newStatus = 'przekazany';
  const newUserId = event.to_user_id || event.user_id;
  
  const { error: updateError } = await supabase
    .from('calendar_events')
    .update({
      status: 'przekazany',
      user_id: newUserId,
      previous_user_id: event.user_id,
      to_user_id: null,
      city_id: null
    })
    .eq('id', eventId);

  if (updateError) {
    throw new Error('Failed to update event');
  }

  // Dispatch event to refresh calendars
  window.dispatchEvent(new CustomEvent('refreshCalendars'));
};

export const rejectTransfer = async (eventId: string): Promise<void> => {
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error('Event not found');
  }

  const { error: updateError } = await supabase
    .from('calendar_events')
    .update({
      status: event.status === 'do_przejęcia' ? 'wydany' : 'wydany',
      to_user_id: null,
      previous_user_id: null
    })
    .eq('id', eventId);

  if (updateError) {
    throw new Error('Failed to reject transfer');
  }

  // Dispatch event to refresh calendars
  window.dispatchEvent(new CustomEvent('refreshCalendars'));
};

export const checkPendingTransfers = async (userId: string): Promise<CalendarEvent[]> => {
  if (!userId || typeof userId !== 'string') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        calendar_id,
        date,
        user_id,
        cities (
          id,
          name,
          voivodeship,
          population
        ),
        status,
        previous_user_id,
        to_user_id
      `)
      .or(`to_user_id.eq.${userId},and(status.eq.przekazywany,to_user_id.eq.${userId})`);

    if (error) {
      console.warn('Failed to fetch pending transfers:', error.message);
      return [];
    }

    return (data || []).map(event => {
      const city = event.cities ? {
        id: event.cities.id,
        name: event.cities.name,
        voivodeship: event.cities.voivodeship,
        population: event.cities.population
      } : null;

      return {
        id: event.id,
        calendarId: event.calendar_id,
        date: new Date(event.date),
        userId: event.user_id,
        city,
        status: event.status,
        previousUserId: event.previous_user_id,
        toUserId: event.to_user_id
      };
    });
  } catch (error) {
    console.warn('Error checking pending transfers:', error);
    return [];
  }
};