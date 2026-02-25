import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StaffUser } from '@/types';

export function useStaffDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaffUsers = useCallback(async (): Promise<StaffUser[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      
      return (data || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        password: user.password,
        createdAt: new Date(user.created_at),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load staff users';
      setError(message);
      console.error('Error loading staff users:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addStaffUser = useCallback(async (user: Omit<StaffUser, 'id' | 'createdAt'>): Promise<StaffUser | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('staff_users')
        .insert([
          {
            email: user.email,
            role: user.role,
            password: user.password,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        password: data.password,
        createdAt: new Date(data.created_at),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add staff user';
      setError(message);
      console.error('Error adding staff user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStaffUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: dbError } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete staff user';
      setError(message);
      console.error('Error deleting staff user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaffUser = useCallback(async (userId: string, updates: Partial<Omit<StaffUser, 'id' | 'createdAt'>>): Promise<StaffUser | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('staff_users')
        .update({
          ...(updates.email && { email: updates.email }),
          ...(updates.role && { role: updates.role }),
          ...(updates.password && { password: updates.password }),
        })
        .eq('id', userId)
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        password: data.password,
        createdAt: new Date(data.created_at),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update staff user';
      setError(message);
      console.error('Error updating staff user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    loadStaffUsers,
    addStaffUser,
    deleteStaffUser,
    updateStaffUser,
  };
}
