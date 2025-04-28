import { supabase } from '../../lib/supabase';
import { Calendar } from '../../types';

export const createCalendar = async (name: string, userId: string): Promise<Calendar> => {
  const { data, error } = await supabase
    .from('calendars')
    .insert([{ name, created_by: userId }])
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create calendar');
  }

  return {
    id: data.id,
    name: data.name,
    events: [],
    order: data.order,
    createdBy: data.created_by
  };
};

export const getCalendars = async (): Promise<Calendar[]> => {
  const { data: calendars, error: calendarsError } = await supabase
    .from('calendars')
    .select(`
      id,
      name,
      order,
      created_by
    `)
    .order('order');

  if (calendarsError) {
    throw new Error('Failed to fetch calendars');
  }

  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select(`
      id,
      calendar_id,
      date,
      user_id,
      city_id,
      status,
      previous_user_id,
      to_user_id,
      cities (
        id,
        name,
        voivodeship,
        population
      )
    `);

  if (eventsError) {
    throw new Error('Failed to fetch calendar events');
  }

  return calendars.map(calendar => ({
    id: calendar.id,
    name: calendar.name,
    events: (events || [])
      .filter(event => event.calendar_id === calendar.id)
      .map(event => ({
        id: event.id,
        calendarId: event.calendar_id,
        date: new Date(event.date),
        userId: event.user_id,
        city: event.cities ? {
          id: event.cities.id,
          name: event.cities.name,
          voivodeship: event.cities.voivodeship,
          population: event.cities.population
        } : null,
        status: event.status,
        previousUserId: event.previous_user_id,
        toUserId: event.to_user_id
      })),
    order: calendar.order,
    createdBy: calendar.created_by
  }));
};

export const updateCalendar = async (id: string, name: string): Promise<Calendar> => {
  const { data, error } = await supabase
    .from('calendars')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to update calendar');
  }

  return {
    id: data.id,
    name: data.name,
    events: [],
    order: data.order,
    createdBy: data.created_by
  };
};

export const deleteCalendar = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('calendars')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete calendar');
  }
};