import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  isAdminAuthenticated: boolean;
  staffRole: string | null;
  isStaffAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<boolean>;
  staffLogout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAdminAuthenticated: false,
  staffRole: null,
  isStaffAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        set({
          user: data.user,
          isAdminAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  staffLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        set({ error: 'Invalid email or password', isLoading: false });
        return false;
      }

      set({
        staffRole: data.role,
        isStaffAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('staffUser', JSON.stringify({ email, role: data.role }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  staffLogout: () => {
    set({
      staffRole: null,
      isStaffAuthenticated: false,
    });
    localStorage.removeItem('staffUser');
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        isAdminAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({ error: message, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Check admin auth
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      if (data.session?.user) {
        set({
          user: data.session.user,
          isAdminAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAdminAuthenticated: false,
          isLoading: false,
        });
      }

      // Check staff auth from localStorage
      const staffUser = localStorage.getItem('staffUser');
      if (staffUser) {
        const { role } = JSON.parse(staffUser);
        set({ staffRole: role, isStaffAuthenticated: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
