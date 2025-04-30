import { supabase } from '../lib/supabase';
import { cachedQuery, mutateQuery } from '../lib/supabase';

export interface ContractPerformance {
  id: string;
  contract_id: string;
  performance_date: string;
  performance_time: string;
  show_title_id: string;
  show_title_name?: string;
  paid_tickets: number;
  unpaid_tickets: number;
  teacher_tickets: number;
  cost: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  season: string;
  contract_date: string;
  client_id: string;
  client_name?: string;
  hall_id: string;
  hall_name?: string;
  city_id?: string;
  city_name?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  performances?: ContractPerformance[];
}

/**
 * Get all contracts with related entity information
 */
export const getContracts = async (): Promise<Contract[]> => {
  return cachedQuery('contracts_with_relations', async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        clients:client_id(id, name),
        halls:hall_id(id, name, city_id),
        halls.cities:halls(city_id(id, name))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch contracts:', error.message, error.stack);
      throw new Error(`Failed to fetch contracts: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    // Fetch performances for all contracts
    const contractIds = (data || []).map(contract => contract.id);
    
    const { data: performancesData, error: performancesError } = await supabase
      .from('contract_performances')
      .select(`
        *,
        show_titles:show_title_id(name)
      `)
      .in('contract_id', contractIds.length > 0 ? contractIds : ['none']);

    if (performancesError) {
      console.error('Failed to fetch contract performances:', performancesError.message, performancesError.stack);
      throw new Error(`Failed to fetch contract performances: ${performancesError.message}`);
    }

    // Group performances by contract_id
    const performancesByContract = (performancesData || []).reduce((acc, perf) => {
      if (!acc[perf.contract_id]) {
        acc[perf.contract_id] = [];
      }
      acc[perf.contract_id].push({
        ...perf,
        show_title_name: perf.show_titles?.name || '',
      });
      return acc;
    }, {} as Record<string, ContractPerformance[]>);

    // Attach performances to contracts
    const contractsWithRelations = (data || []).map(contract => {
      return {
        ...contract,
        client_name: contract.clients?.name || '',
        hall_name: contract.halls?.name || '',
        city_id: contract.halls?.city_id || '',
        city_name: contract.halls?.cities?.name || '',
        performances: performancesByContract[contract.id] || []
      };
    });

    return contractsWithRelations;
  });
};

/**
 * Get contracts for a specific city
 */
export const getContractsByCity = async (cityId: string): Promise<Contract[]> => {
  return cachedQuery(`contracts_by_city_${cityId}`, async () => {
    // First get all halls in the city
    const { data: halls, error: hallsError } = await supabase
      .from('halls')
      .select('id')
      .eq('city_id', cityId);

    if (hallsError) {
      console.error(`Failed to fetch halls for city ${cityId}:`, hallsError.message, hallsError.stack);
      throw new Error(`Failed to fetch halls for city: ${hallsError.message}`);
    }

    const hallIds = (halls || []).map(hall => hall.id);
    
    if (hallIds.length === 0) {
      return []; // No halls in this city, so no contracts
    }

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        clients:client_id(id, name),
        halls:hall_id(id, name, city_id),
        halls.cities:halls(city_id(id, name))
      `)
      .in('hall_id', hallIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch contracts for city ${cityId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch contracts: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    // Fetch performances for all contracts
    const contractIds = (data || []).map(contract => contract.id);
    
    if (contractIds.length === 0) {
      return []; // No contracts found
    }

    const { data: performancesData, error: performancesError } = await supabase
      .from('contract_performances')
      .select(`
        *,
        show_titles:show_title_id(name)
      `)
      .in('contract_id', contractIds);

    if (performancesError) {
      console.error('Failed to fetch contract performances:', performancesError.message, performancesError.stack);
      throw new Error(`Failed to fetch contract performances: ${performancesError.message}`);
    }

    // Group performances by contract_id
    const performancesByContract = (performancesData || []).reduce((acc, perf) => {
      if (!acc[perf.contract_id]) {
        acc[perf.contract_id] = [];
      }
      acc[perf.contract_id].push({
        ...perf,
        show_title_name: perf.show_titles?.name || '',
      });
      return acc;
    }, {} as Record<string, ContractPerformance[]>);

    // Attach performances to contracts
    const contractsWithRelations = (data || []).map(contract => {
      return {
        ...contract,
        client_name: contract.clients?.name || '',
        hall_name: contract.halls?.name || '',
        city_id: contract.halls?.city_id || '',
        city_name: contract.halls?.cities?.name || '',
        performances: performancesByContract[contract.id] || []
      };
    });

    return contractsWithRelations;
  });
};

/**
 * Get contracts for a specific client
 */
export const getContractsByClient = async (clientId: string): Promise<Contract[]> => {
  return cachedQuery(`contracts_by_client_${clientId}`, async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        clients:client_id(id, name),
        halls:hall_id(id, name, city_id),
        halls.cities:halls(city_id(id, name))
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch contracts for client ${clientId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch contracts: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    // Fetch performances for all contracts
    const contractIds = (data || []).map(contract => contract.id);
    
    if (contractIds.length === 0) {
      return []; // No contracts found
    }

    const { data: performancesData, error: performancesError } = await supabase
      .from('contract_performances')
      .select(`
        *,
        show_titles:show_title_id(name)
      `)
      .in('contract_id', contractIds);

    if (performancesError) {
      console.error('Failed to fetch contract performances:', performancesError.message, performancesError.stack);
      throw new Error(`Failed to fetch contract performances: ${performancesError.message}`);
    }

    // Group performances by contract_id
    const performancesByContract = (performancesData || []).reduce((acc, perf) => {
      if (!acc[perf.contract_id]) {
        acc[perf.contract_id] = [];
      }
      acc[perf.contract_id].push({
        ...perf,
        show_title_name: perf.show_titles?.name || '',
      });
      return acc;
    }, {} as Record<string, ContractPerformance[]>);

    // Attach performances to contracts
    const contractsWithRelations = (data || []).map(contract => {
      return {
        ...contract,
        client_name: contract.clients?.name || '',
        hall_name: contract.halls?.name || '',
        city_id: contract.halls?.city_id || '',
        city_name: contract.halls?.cities?.name || '',
        performances: performancesByContract[contract.id] || []
      };
    });

    return contractsWithRelations;
  });
};

/**
 * Get a single contract by ID with all related information
 */
export const getContractById = async (contractId: string): Promise<Contract | null> => {
  return cachedQuery(`contract_${contractId}`, async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        clients:client_id(id, name),
        halls:hall_id(id, name, city_id),
        halls.cities:halls(city_id(id, name))
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error(`Failed to fetch contract ${contractId}:`, error.message, error.stack);
      throw new Error(`Failed to fetch contract: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }

    // Fetch performances for the contract
    const { data: performancesData, error: performancesError } = await supabase
      .from('contract_performances')
      .select(`
        *,
        show_titles:show_title_id(name)
      `)
      .eq('contract_id', contractId);

    if (performancesError) {
      console.error(`Failed to fetch performances for contract ${contractId}:`, performancesError.message, performancesError.stack);
      throw new Error(`Failed to fetch contract performances: ${performancesError.message}`);
    }

    const performances = (performancesData || []).map(perf => ({
      ...perf,
      show_title_name: perf.show_titles?.name || '',
    }));

    return {
      ...data,
      client_name: data.clients?.name || '',
      hall_name: data.halls?.name || '',
      city_id: data.halls?.city_id || '',
      city_name: data.halls?.cities?.name || '',
      performances
    };
  });
};

/**
 * Create a new contract with performances
 */
export const createContract = async (
  contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>,
  performances: Omit<ContractPerformance, 'id' | 'contract_id' | 'created_at' | 'updated_at'>[]
): Promise<Contract> => {
  return mutateQuery('contracts', async () => {
    // Verify the client exists
    const { data: clientExists, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', contract.client_id)
      .single();

    if (clientError || !clientExists) {
      throw new Error('Invalid client selected. Please select a valid client.');
    }

    // Verify the hall exists
    const { data: hallExists, error: hallError } = await supabase
      .from('halls')
      .select('id')
      .eq('id', contract.hall_id)
      .single();

    if (hallError || !hallExists) {
      throw new Error('Invalid hall selected. Please select a valid hall.');
    }

    // Start a transaction
    // Note: Supabase JS doesn't support transactions directly, so we're simulating one with careful error handling
    
    // Insert contract
    const { data: newContract, error: contractError } = await supabase
      .from('contracts')
      .insert([{
        contract_number: contract.contract_number,
        season: contract.season,
        contract_date: contract.contract_date,
        client_id: contract.client_id,
        hall_id: contract.hall_id,
        notes: contract.notes,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (contractError) {
      console.error('Failed to create contract:', contractError.message, contractError.stack);
      throw new Error(`Failed to create contract: ${contractError.message}${contractError.details ? ` (${contractError.details})` : ''}`);
    }

    if (performances.length > 0) {
      // Insert performances
      const { error: performancesError } = await supabase
        .from('contract_performances')
        .insert(
          performances.map(perf => ({
            contract_id: newContract.id,
            performance_date: perf.performance_date,
            performance_time: perf.performance_time,
            show_title_id: perf.show_title_id,
            paid_tickets: perf.paid_tickets,
            unpaid_tickets: perf.unpaid_tickets,
            teacher_tickets: perf.teacher_tickets,
            cost: perf.cost,
            notes: perf.notes,
            updated_at: new Date().toISOString()
          }))
        );

      if (performancesError) {
        // Attempt to rollback by deleting the contract
        await supabase
          .from('contracts')
          .delete()
          .eq('id', newContract.id);
          
        console.error('Failed to add performances to contract:', performancesError.message, performancesError.stack);
        throw new Error(`Failed to add performances to contract: ${performancesError.message}`);
      }
    }

    // Now fetch the complete contract with all related data
    return getContractById(newContract.id) as Promise<Contract>;
  });
};

/**
 * Update an existing contract and its performances
 */
export const updateContract = async (
  contractId: string,
  contract: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>,
  performances?: Omit<ContractPerformance, 'contract_id' | 'created_at' | 'updated_at'>[]
): Promise<Contract> => {
  return mutateQuery(`contract_${contractId}`, async () => {
    // Verify the client exists if it's being updated
    if (contract.client_id) {
      const { data: clientExists, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', contract.client_id)
        .single();

      if (clientError || !clientExists) {
        throw new Error('Invalid client selected. Please select a valid client.');
      }
    }

    // Verify the hall exists if it's being updated
    if (contract.hall_id) {
      const { data: hallExists, error: hallError } = await supabase
        .from('halls')
        .select('id')
        .eq('id', contract.hall_id)
        .single();

      if (hallError || !hallExists) {
        throw new Error('Invalid hall selected. Please select a valid hall.');
      }
    }

    // Update contract
    const { error: contractError } = await supabase
      .from('contracts')
      .update({
        ...contract,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (contractError) {
      console.error(`Failed to update contract ${contractId}:`, contractError.message, contractError.stack);
      throw new Error(`Failed to update contract: ${contractError.message}${contractError.details ? ` (${contractError.details})` : ''}`);
    }

    // If performances are provided, update them
    if (performances) {
      // First delete existing performances
      const { error: deleteError } = await supabase
        .from('contract_performances')
        .delete()
        .eq('contract_id', contractId);

      if (deleteError) {
        console.error(`Failed to delete performances for contract ${contractId}:`, deleteError.message, deleteError.stack);
        throw new Error(`Failed to update contract performances: ${deleteError.message}`);
      }

      if (performances.length > 0) {
        // Then insert new performances
        const { error: performancesError } = await supabase
          .from('contract_performances')
          .insert(
            performances.map(perf => ({
              contract_id: contractId,
              performance_date: perf.performance_date,
              performance_time: perf.performance_time,
              show_title_id: perf.show_title_id,
              paid_tickets: perf.paid_tickets,
              unpaid_tickets: perf.unpaid_tickets,
              teacher_tickets: perf.teacher_tickets,
              cost: perf.cost,
              notes: perf.notes,
              ...(perf.id ? { id: perf.id } : {}), // Keep existing ID if provided
              updated_at: new Date().toISOString()
            }))
          );

        if (performancesError) {
          console.error(`Failed to add performances to contract ${contractId}:`, performancesError.message, performancesError.stack);
          throw new Error(`Failed to add performances to contract: ${performancesError.message}`);
        }
      }
    }

    // Now fetch the complete contract with all related data
    return getContractById(contractId) as Promise<Contract>;
  });
};

/**
 * Delete a contract and all its performances
 */
export const deleteContract = async (contractId: string): Promise<void> => {
  return mutateQuery('contracts', async () => {
    // First delete all performances
    const { error: performancesError } = await supabase
      .from('contract_performances')
      .delete()
      .eq('contract_id', contractId);

    if (performancesError) {
      console.error(`Failed to delete performances for contract ${contractId}:`, performancesError.message, performancesError.stack);
      throw new Error(`Failed to delete contract performances: ${performancesError.message}`);
    }

    // Then delete the contract
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      console.error(`Failed to delete contract ${contractId}:`, error.message, error.stack);
      throw new Error(`Failed to delete contract: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    }
  });
}; 