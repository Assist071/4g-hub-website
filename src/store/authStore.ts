import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAdminAuthenticated: false,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
