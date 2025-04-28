import { supabase } from '../../lib/supabase';
import { CalendarEvent, EventStatus } from '../../types';
import { cleanEventDataForStatus } from '../../utils/eventValidation';
import { getCalendars } from './calendars';
import { debouncedMutation } from '../../lib/supabase';

export const updateCalendarEvent = async (
  calendarId: string,
  dates: Date[],
  eventData: Partial<CalendarEvent>
): Promise<void> => {
  try {
    // Create a single mutation key for all dates
    const mutationKey = `calendar_events_${calendarId}_${dates.map(d => d.toISOString()).join('_')}`;

    await debouncedMutation(mutationKey, async () => {
      const cleanedEventData = cleanEventDataForStatus(eventData);
      const updates = dates.map(date => {
        const utcDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ));

        return {
          calendar_id: calendarId,
          date: utcDate.toISOString().split('T')[0],
          status: cleanedEventData.status || 'niewydany',
          user_id: cleanedEventData.userId,
          city_id: cleanedEventData.city?.id || null,
          previous_user_id: cleanedEventData.previousUserId || null,
          to_user_id: cleanedEventData.toUserId || null
        };
      });

      // Handle niewydany status
      if (cleanedEventData.status === 'niewydany') {
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('calendar_id', calendarId)
          .in('date', updates.map(u => u.date));

        if (deleteError) throw deleteError;
        return;
      }

      // Batch update existing events
      const { error: updateError } = await supabase
        .from('calendar_events')
        .upsert(updates, {
          onConflict: 'calendar_id,date',
          ignoreDuplicates: false
        });

      if (updateError) {
        console.error('Failed to update calendar events:', updateError);
        const { error: retryError } = await supabase
          .from('calendar_events')
          .upsert(updates, {
            onConflict: 'calendar_id,date'
          });
        if (retryError) throw retryError;
      }
    });
    
    // Refresh calendars after successful update
    const calendars = await getCalendars();
    window.dispatchEvent(new CustomEvent('refreshCalendars', { detail: calendars }));
    
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
};