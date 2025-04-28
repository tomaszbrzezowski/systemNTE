import { City } from '../types';
import { supabase } from '../lib/supabase';

export const getCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select(`
      id,
      name,
      voivodeship,
      population, 
      latitude,
      longitude,
      created_at
    `)
    .order('voivodeship, name');

  if (error) {
    throw new Error('Failed to fetch cities');
  }

  return (data || []).map(city => ({
    id: city.id,
    name: city.name,
    voivodeship: city.voivodeship,
    population: city.population,
    latitude: city.latitude,
    longitude: city.longitude
  }));
};

export const getUserCities = async (userId: string): Promise<City[]> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        assigned_city_ids,
        role
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      throw new Error(`User not found: ${userError.message}`);
    }

    // Administrators can see all cities
    if (user.role === 'administrator') {
      return getCities();
    }

    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select(`
        id,
        name,
        voivodeship,
        population,
        latitude,
        longitude
      `)
      .in('id', user.assigned_city_ids || [])
      .order('name');

    if (citiesError) {
      console.error('Cities fetch error:', citiesError);
      throw new Error(`Failed to fetch user cities: ${citiesError.message}`);
    }

    return (cities || []).map(city => ({
      id: city.id,
      name: city.name,
      voivodeship: city.voivodeship,
      population: city.population,
      latitude: city.latitude,
      longitude: city.longitude
    }));
  } catch (error) {
    throw error;
  }
};

export const createCity = async (city: Omit<City, 'id'>): Promise<City> => {
  const { data, error } = await supabase
    .from('cities')
    .insert([city])
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create city');
  }

  return data;
};

export const deleteCity = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('cities')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete city');
  }
};

export const updateCity = async (cityId: string, city: City): Promise<void> => {
  const { error } = await supabase
    .from('cities')
    .update({
      latitude: city.latitude,
      longitude: city.longitude
    })
    .eq('id', cityId);

  if (error) {
    throw new Error('Failed to update city coordinates');
  }
};

export const getCityCoordinates = async (cityId: string): Promise<{ latitude: number; longitude: number } | null> => {
  const { data, error } = await supabase
    .from('cities')
    .select('latitude, longitude')
    .eq('id', cityId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude
  };
};

export const getAllCityCoordinates = async (): Promise<Array<{ id: string; name: string; latitude: number; longitude: number }>> => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, latitude, longitude')
    .order('name');

  if (error) {
    throw new Error('Failed to fetch city coordinates');
  }

  return data || [];
}