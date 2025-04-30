import { supabase } from '../lib/supabase';
import { cachedQuery, mutateQuery } from '../lib/supabase';

export interface Client {
  id: string;
  name: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  notes?: string | null;
  city_id: string;
  city_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all clients with city information
 */
export const getClients = async (): Promise<Client[]> => {
  return cachedQuery('clients_with_cities', async () => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        cities:city_id(name)
      `)
      .order('name');

    if (error) {
      console.error('Failed to fetch clients:', error.message, error.stack);
      throw new Error(`Failed to fetch clients: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return (data || []).map(client => ({
      ...client,
      city_name: client.cities?.name || '',
    }));
  });
};

/**
 * Get clients for a specific city
 */
export const getClientsByCity = async (cityId: string): Promise<Client[]> => {
  return cachedQuery(`clients_by_city_${cityId}`, async () => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        cities:city_id(name)
      `)
      .eq('city_id', cityId)
      .order('name');

    if (error) {
      console.error(`Failed to fetch clients for city ${cityId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch clients: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return (data || []).map(client => ({
      ...client,
      city_name: client.cities?.name || '',
    }));
  });
};

/**
 * Get a single client by ID with city information
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
  return cachedQuery(`client_${clientId}`, async () => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        cities:city_id(name)
      `)
      .eq('id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error(`Failed to fetch client ${clientId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch client: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Create a new client
 */
export const createClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
  return mutateQuery('clients', async () => {
    // Verify the city exists
    const { data: cityExists, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('id', client.city_id)
      .single();

    if (cityError || !cityExists) {
      throw new Error('Invalid city selected. Please select a valid city.');
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: client.name,
        address: client.address,
        contact_person: client.contact_person,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        notes: client.notes,
        city_id: client.city_id,
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        cities:city_id(name)
      `)
      .single();

    if (error) {
      console.error('Failed to create client:', error.message, error.stack);
      throw new Error(`Failed to create client: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Update an existing client
 */
export const updateClient = async (clientId: string, client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>): Promise<Client> => {
  return mutateQuery(`client_${clientId}`, async () => {
    // Verify the city exists if it's being updated
    if (client.city_id) {
      const { data: cityExists, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .eq('id', client.city_id)
        .single();

      if (cityError || !cityExists) {
        throw new Error('Invalid city selected. Please select a valid city.');
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .update({
        ...client,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select(`
        *,
        cities:city_id(name)
      `)
      .single();

    if (error) {
      console.error(`Failed to update client ${clientId}:`, error.message, error.stack);
      throw new Error(`Failed to update client: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    return {
      ...data,
      city_name: data.cities?.name || '',
    };
  });
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<void> => {
  return mutateQuery('clients', async () => {
    // Check if client has any contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (contractsError) {
      console.error(`Failed to check contracts for client ${clientId}:`, contractsError.message, contractsError.stack);
      throw new Error(`Failed to check if client can be deleted: ${contractsError.message}`);
    }

    if (contracts && contracts.length > 0) {
      throw new Error('Cannot delete client: it has associated contracts. Please delete the contracts first.');
    }

    // Now delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.error(`Failed to delete client ${clientId}:`, error.message, error.stack);
      throw new Error(`Failed to delete client: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }
  });
}; 