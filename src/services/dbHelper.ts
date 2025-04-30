import { supabase } from '../lib/supabase';

/**
 * Checks if a record exists in a table with the given ID
 * @param table Table name
 * @param id Record ID
 * @returns True if the record exists, false otherwise
 */
export const recordExists = async (table: string, id: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error checking if record exists in ${table}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(`Error checking if record exists in ${table}:`, error);
    return false;
  }
};

/**
 * Checks if a foreign key value exists in the referenced table
 * @param table Referenced table name
 * @param column Column name to check 
 * @param value Value to check
 * @returns True if the record exists, false otherwise
 */
export const foreignKeyExists = async (table: string, column: string, value: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(column, value)
      .maybeSingle();

    if (error) {
      console.error(`Error checking if foreign key exists in ${table}.${column}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(`Error checking if foreign key exists in ${table}.${column}:`, error);
    return false;
  }
};

/**
 * Gets all records from a table that are related to a city
 * @param table Table name
 * @param cityId City ID
 * @returns Array of records
 */
export const getRecordsByCity = async (table: string, cityId: string): Promise<any[]> => {
  try {
    // Different tables have different ways to reference cities
    let query;
    
    switch (table) {
      case 'halls':
        // Halls directly reference city_id
        query = supabase
          .from(table)
          .select('*')
          .eq('city_id', cityId);
        break;
        
      case 'clients':
        // Clients directly reference city_id
        query = supabase
          .from(table)
          .select('*')
          .eq('city_id', cityId);
        break;
        
      case 'contracts':
        // Contracts reference halls which reference cities
        // First get all halls in the city
        const { data: halls, error: hallsError } = await supabase
          .from('halls')
          .select('id')
          .eq('city_id', cityId);
          
        if (hallsError || !halls || halls.length === 0) {
          return [];
        }
        
        const hallIds = halls.map(hall => hall.id);
        query = supabase
          .from(table)
          .select('*')
          .in('hall_id', hallIds);
        break;
        
      default:
        throw new Error(`Unsupported table: ${table}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error getting records from ${table} for city ${cityId}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error getting records from ${table} for city ${cityId}:`, error);
    return [];
  }
};

/**
 * Counts the number of related records in another table
 * @param table Table to count records in
 * @param foreignKey Foreign key column name
 * @param id ID to check
 * @returns Number of related records
 */
export const countRelatedRecords = async (table: string, foreignKey: string, id: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(foreignKey, id);
      
    if (error) {
      console.error(`Error counting related records in ${table} for ${foreignKey}=${id}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Error counting related records in ${table} for ${foreignKey}=${id}:`, error);
    return 0;
  }
};

/**
 * Safely deletes a record and all its related records
 * @param table Table name
 * @param id Record ID
 * @param relatedTables Array of objects with related table info: { table, foreignKey }
 * @returns True if deletion was successful, false otherwise
 */
export const safeDelete = async (
  table: string, 
  id: string, 
  relatedTables: Array<{ table: string, foreignKey: string }>
): Promise<boolean> => {
  try {
    // Delete related records first
    for (const related of relatedTables) {
      const { error } = await supabase
        .from(related.table)
        .delete()
        .eq(related.foreignKey, id);
        
      if (error) {
        console.error(`Error deleting related records from ${related.table} for ${related.foreignKey}=${id}:`, error);
        return false;
      }
    }
    
    // Now delete the main record
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting record from ${table} with id=${id}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting record from ${table} with id=${id}:`, error);
    return false;
  }
};

/**
 * Gets the full hierarchy of a record with its relations
 * @param options Options for the query
 * @returns The record with its relations
 */
export const getRecordWithRelations = async (options: {
  table: string;
  id: string;
  columns?: string;
  relations: Array<{
    name: string;
    query: string;
  }>;
}): Promise<any> => {
  try {
    const { table, id, columns = '*', relations } = options;
    
    // Build the select query with all relations
    let selectQuery = columns;
    for (const relation of relations) {
      selectQuery += `, ${relation.name}(${relation.query})`;
    }
    
    const { data, error } = await supabase
      .from(table)
      .select(selectQuery)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error getting record from ${table} with id=${id}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getRecordWithRelations:`, error);
    return null;
  }
};

/**
 * Creates a record and returns the created record with its relations
 * @param options Options for the creation
 * @returns The created record with its relations
 */
export const createRecordWithRelations = async (options: {
  table: string;
  data: any;
  returnColumns?: string;
  relations: Array<{
    name: string;
    query: string;
  }>;
}): Promise<any> => {
  try {
    const { table, data, returnColumns = '*', relations } = options;
    
    // Build the select query with all relations
    let selectQuery = returnColumns;
    for (const relation of relations) {
      selectQuery += `, ${relation.name}(${relation.query})`;
    }
    
    const { data: createdData, error } = await supabase
      .from(table)
      .insert([data])
      .select(selectQuery)
      .single();
      
    if (error) {
      console.error(`Error creating record in ${table}:`, error);
      return null;
    }
    
    return createdData;
  } catch (error) {
    console.error(`Error in createRecordWithRelations:`, error);
    return null;
  }
};

/**
 * Updates a record and returns the updated record with its relations
 * @param options Options for the update
 * @returns The updated record with its relations
 */
export const updateRecordWithRelations = async (options: {
  table: string;
  id: string;
  data: any;
  returnColumns?: string;
  relations: Array<{
    name: string;
    query: string;
  }>;
}): Promise<any> => {
  try {
    const { table, id, data, returnColumns = '*', relations } = options;
    
    // Build the select query with all relations
    let selectQuery = returnColumns;
    for (const relation of relations) {
      selectQuery += `, ${relation.name}(${relation.query})`;
    }
    
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select(selectQuery)
      .single();
      
    if (error) {
      console.error(`Error updating record in ${table} with id=${id}:`, error);
      return null;
    }
    
    return updatedData;
  } catch (error) {
    console.error(`Error in updateRecordWithRelations:`, error);
    return null;
  }
}; 