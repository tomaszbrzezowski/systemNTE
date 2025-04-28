import { supabase } from '../lib/supabase';
import { Hall } from '../types';

export const getHalls = async (): Promise<Hall[]> => {
  const { data, error } = await supabase
    .from('halls')
    .select('*')
    .order('name');

  if (error) {
    console.error('Failed to fetch halls:', error.message, error.stack);
    throw new Error(`Failed to fetch halls: ${error.message}${error.details ? ` (${error.details})` : ''}`);
  }

  return (data || []) as Hall[];
};