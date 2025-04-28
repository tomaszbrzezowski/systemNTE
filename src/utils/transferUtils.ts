import { User, CalendarEvent, EventStatus } from '../types';
import { supabase } from '../lib/supabase';

export const initiateTransfer = async (
  event: CalendarEvent,
  fromUser: User,
  toUserId: string
): Promise<void> => {
  try {
    // First update event status to do_przekazania
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        status: 'do_przekazania' as EventStatus,
        previous_user_id: fromUser.id,
        city_id: null // Clear city during transfer
      })
      .eq('id', event.id);

    if (eventError) throw eventError;

    // Create transfer request
    const { error: transferError } = await supabase
      .from('transfer_requests')
      .insert([{
        event_id: event.id,
        from_user_id: fromUser.id,
        to_user_id: toUserId,
        accepted: null
      }]);

    if (transferError) throw transferError;
  } catch (error) {
    console.error('Failed to initiate transfer:', error);
    throw error;
  }
};

export const acceptTransfer = async (
  eventId: string,
  toUserId: string
): Promise<void> => {
  try {
    // Update event status to przekazywany
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        status: 'przekazywany' as EventStatus,
        user_id: toUserId
      })
      .eq('id', eventId);

    if (eventError) throw eventError;

    // Update transfer request as accepted
    const { error: transferError } = await supabase
      .from('transfer_requests')
      .update({ accepted: true })
      .eq('event_id', eventId);

    if (transferError) throw transferError;
  } catch (error) {
    console.error('Failed to accept transfer:', error);
    throw error;
  }
};

export const rejectTransfer = async (eventId: string): Promise<void> => {
  try {
    // Revert event status to original
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        status: 'wydany' as EventStatus,
        previous_user_id: null
      })
      .eq('id', eventId);

    if (eventError) throw eventError;

    // Delete transfer request
    const { error: transferError } = await supabase
      .from('transfer_requests')
      .delete()
      .eq('event_id', eventId);

    if (transferError) throw transferError;
  } catch (error) {
    console.error('Failed to reject transfer:', error);
    throw error;
  }
};

export const checkPendingTransfers = async (userId: string): Promise<CalendarEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('transfer_requests')
      .select(`
        *,
        calendar_events (*)
      `)
      .eq('to_user_id', userId)
      .is('accepted', null);

    if (error) throw error;

    return data?.map(request => request.calendar_events) || [];
  } catch (error) {
    console.error('Failed to check pending transfers:', error);
    return [];
  }
};