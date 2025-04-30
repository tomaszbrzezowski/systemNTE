import { supabase } from '../lib/supabase';
import { cachedQuery, mutateQuery } from '../lib/supabase';

export interface Hall {
  id: string;
  name: string;
  address: string;
  city_id: string;
  city_name?: string;
  seats: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all halls with city information
 */
export const getHalls = async (): Promise<Hall[]> => {
  return cachedQuery('halls_with_cities', async () => {
    const { data, error } = await supabase
      .from('halls')
      .select(`
        *,
        cities:city_id(name)
      `)
      .order('name');

    if (error) {
      console.error('Failed to fetch halls:', error.message, error.stack);
      throw new Error(`Failed to fetch halls: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return (data || []).map(hall => ({
      ...hall,
      city_name: hall.cities?.name || '',
    }));
  });
};

/**
 * Get halls for a specific city
 */
export const getHallsByCity = async (cityId: string): Promise<Hall[]> => {
  return cachedQuery(`halls_by_city_${cityId}`, async () => {
    const { data, error } = await supabase
      .from('halls')
      .select(`
        *,
        cities:city_id(name)
      `)
      .eq('city_id', cityId)
      .order('name');

    if (error) {
      console.error(`Failed to fetch halls for city ${cityId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch halls: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return (data || []).map(hall => ({
      ...hall,
      city_name: hall.cities?.name || '',
    }));
  });
};

/**
 * Get a single hall by ID with city information
 */
export const getHallById = async (hallId: string): Promise<Hall | null> => {
  return cachedQuery(`hall_${hallId}`, async () => {
    const { data, error } = await supabase
      .from('halls')
      .select(`
        *,
        cities:city_id(name)
      `)
      .eq('id', hallId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error(`Failed to fetch hall ${hallId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch hall: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Create a new hall
 */
export const createHall = async (hall: Omit<Hall, 'id' | 'created_at' | 'updated_at'>): Promise<Hall> => {
  return mutateQuery('halls', async () => {
    // Verify the city exists
    const { data: cityExists, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('id', hall.city_id)
      .single();

    if (cityError || !cityExists) {
      throw new Error('Invalid city selected. Please select a valid city.');
    }

    const { data, error } = await supabase
      .from('halls')
      .insert([{
        name: hall.name,
        address: hall.address,
        city_id: hall.city_id,
        seats: hall.seats,
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        cities:city_id(name)
      `)
      .single();

    if (error) {
      console.error('Failed to create hall:', error.message, error.stack);
      throw new Error(`Failed to create hall: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Update an existing hall
 */
export const updateHall = async (hallId: string, hall: Partial<Omit<Hall, 'id' | 'created_at' | 'updated_at'>>): Promise<Hall> => {
  return mutateQuery(`hall_${hallId}`, async () => {
    // Verify the city exists if it's being updated
    if (hall.city_id) {
      const { data: cityExists, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .eq('id', hall.city_id)
        .single();

      if (cityError || !cityExists) {
        throw new Error('Invalid city selected. Please select a valid city.');
      }
    }

    const { data, error } = await supabase
      .from('halls')
      .update({
        ...hall,
        updated_at: new Date().toISOString()
      })
      .eq('id', hallId)
      .select(`
        *,
        cities:city_id(name)
      `)
      .single();

    if (error) {
      console.error(`Failed to update hall ${hallId}:`, error.message, error.stack);
      throw new Error(`Failed to update hall: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Delete a hall
 */
export const deleteHall = async (hallId: string): Promise<void> => {
  return mutateQuery('halls', async () => {
    // Check if hall has any contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('hall_id', hallId)
      .limit(1);

    if (contractsError) {
      console.error(`Failed to check contracts for hall ${hallId}:`, contractsError.message, contractsError.stack);
      throw new Error(`Failed to check if hall can be deleted: ${contractsError.message}`);
    }

    if (contracts && contracts.length > 0) {
      throw new Error('Cannot delete hall: it has associated contracts. Please delete the contracts first.');
    }

    // Check if hall has any layouts
    const { data: layouts, error: layoutsError } = await supabase
      .from('hall_layouts')
      .select('id')
      .eq('hall_id', hallId)
      .limit(1);

    if (layoutsError) {
      console.error(`Failed to check layouts for hall ${hallId}:`, layoutsError.message, layoutsError.stack);
      throw new Error(`Failed to check if hall can be deleted: ${layoutsError.message}`);
    }

    // Delete layouts first if they exist
    if (layouts && layouts.length > 0) {
      const { error: deleteLayoutsError } = await supabase
        .from('hall_layouts')
        .delete()
        .eq('hall_id', hallId);

      if (deleteLayoutsError) {
        console.error(`Failed to delete layouts for hall ${hallId}:`, deleteLayoutsError.message, deleteLayoutsError.stack);
        throw new Error(`Failed to delete hall layouts: ${deleteLayoutsError.message}`);
      }
    }

    // Now delete the hall
    const { error } = await supabase
      .from('halls')
      .delete()
      .eq('id', hallId);

    if (error) {
      console.error(`Failed to delete hall ${hallId}:`, error.message, error.stack);
      throw new Error(`Failed to delete hall: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }
  });
};