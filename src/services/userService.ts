import { supabase } from '../lib/supabase';

export interface User {
  id?: string;
  username: string;
  email: string;
  program?: string;
  role?: string;
  status?: 'active' | 'inactive';
  credit_score?: number;
  rating?: number;
  total_ratings?: number;
  bio?: string;
  avatar_url?: string;
  frame_effect?: string;
  glow_effect?: string;

  created_at?: string;
  updated_at?: string;
  last_active?: string;
}

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return { data: null, error };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user:', error);
    return { data: null, error };
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user:', error);
    return { data: null, error };
  }
}

/**
 * Create a new user
 */
export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: user.status || 'active',
        credit_score: user.credit_score || 700,
        rating: user.rating || 0,
        total_ratings: user.total_ratings || 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { data: null, error };
  }
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return { data: null, error };
  }
}

/**
 * Update user's last active timestamp
 */
export async function updateUserLastActive(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user last active:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating user last active:', error);
    return { data: null, error };
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { data: null, error };
  }
}

/**
 * Get active users (users who have been active in the last 30 days)
 */
export async function getActiveUsers() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active')
      .gte('last_active', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active users:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active users:', error);
    return { data: null, error };
  }
}

/**
 * Get inactive users (users who have not been active in the last 30 days)
 */
export async function getInactiveUsers() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`status.eq.inactive,last_active.lt.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inactive users:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching inactive users:', error);
    return { data: null, error };
  }
}

/**
 * Subscribe to users table changes
 */
export function subscribeToUsers(callback: (users: User[]) => void) {
  const channel = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      async () => {
        // Fetch updated users
        const { data } = await getAllUsers();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Upload user avatar to Supabase Storage
 */
export async function uploadUserAvatar(userId: string, file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true, // Replace existing avatar
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return { data: null, error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user's avatar_url in database
    await updateUser(userId, { avatar_url: publicUrl });

    return { data: { url: publicUrl }, error: null };
  } catch (error) {
    console.error('Unexpected error uploading avatar:', error);
    return { data: null, error };
  }
}
