import { User } from '../../types';
import { CreateUserData, AuthError } from './types';
import { supabase } from '../../lib/supabase';
import { isValidUUID } from '../../utils/validationUtils';

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error('Failed to create user');

    return {
      id: authUser.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      active: true,
      createdAt: new Date(),
      assignedCityIds: [],
      organizatorIds: []
    };
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new AuthError('Failed to create user', 'create_user_failed', 500);
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    if (!users) return [];

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: new Date(user.created_at),
      assignedCityIds: user.assigned_city_ids || [],
      organizatorIds: user.organizer_ids || [],
      supervisorId: user.supervisor_id
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error); 
    return []; // Return empty array instead of throwing
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Prepare update payload
    const updateData = {
      name: updates.name,
      role: updates.role,
      active: updates.active,
      assigned_city_ids: updates.assignedCityIds,
      organizer_ids: updates.organizatorIds,
      supervisor_id: updates.supervisorId
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!user) throw new Error('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: new Date(user.created_at),
      assignedCityIds: user.assigned_city_ids || [],
      organizatorIds: user.organizer_ids || [],
      supervisorId: user.supervisor_id
    };
  } catch (error) {
    console.error('Failed to update user:', error);
    throw new Error('Failed to update user');
  }
};