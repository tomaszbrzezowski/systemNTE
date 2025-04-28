import { useState } from 'react';
import { User, City } from '../types';
import { updateUser } from '../services/auth';
import { createCity, deleteCity } from '../services/cities';

export const useUserCityHandlers = (
  currentUser: User | null,
  setUsers: (users: User[]) => void,
  setCities: (cities: City[]) => void,
  loadUsers: () => Promise<void>,
  loadCities: () => Promise<void>
) => {
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUser(userId, updates);
      await loadUsers();
      if (userId === currentUser?.id) {
        await loadCities();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleAddCity = async (cityData: Omit<City, 'id'>) => {
    try {
      const newCity = await createCity(cityData);
      setCities(prevCities => [...prevCities, newCity]);
    } catch (error) {
      console.error('Failed to create city:', error);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    try {
      await deleteCity(cityId);
      setCities(prevCities => prevCities.filter(city => city.id !== cityId));
    } catch (error) {
      console.error('Failed to delete city:', error);
    }
  };

  return {
    handleUpdateUser,
    handleAddCity,
    handleDeleteCity
  };
};