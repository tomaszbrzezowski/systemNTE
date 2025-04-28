import { User } from '../../types';
import { supabase } from '../../lib/supabase';

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms

export async function fetchUserProfile(userId: string): Promise<User> {
  let lastError = null;

  for (let i = 0; i < RETRY_DELAYS.length; i++) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('User profile not found');

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        active: data.active,
        createdAt: new Date(data.created_at),
        assignedCityIds: data.assigned_city_ids || [],
        organizatorIds: data.organizer_ids || [],
        supervisorId: data.supervisor_id
      };
    } catch (error) {
      lastError = error;
      if (i < RETRY_DELAYS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[i]));
      }
    }
  }

  throw lastError;
}