import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { adminRateLimiter, staffRateLimiter } from '@/lib/rateLimiter';
import { adminSessionManager, staffSessionManager } from '@/lib/sessionManager';
import { loginAttemptLogger } from '@/lib/loginAttemptLogger';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  isAdminAuthenticated: boolean;
  staffRole: string | null;
  isStaffAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accountLocked: boolean;
  lockoutTimeRemaining: number;
  
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
  accountLocked: false,
  lockoutTimeRemaining: 0,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null, accountLocked: false });
    
    try {
      // Check rate limiting
      if (!adminRateLimiter.canAttemptLogin(email)) {
        const timeRemaining = adminRateLimiter.getLockoutTimeRemaining(email);
        const message = `Account temporarily locked. Try again in ${timeRemaining} seconds.`;
        
        await loginAttemptLogger.logAttempt({
          email,
          success: false,
          errorMessage: message,
          attemptType: 'admin',
        });

        set({
          error: message,
          isLoading: false,
          accountLocked: true,
          lockoutTimeRemaining: timeRemaining,
        });
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        adminRateLimiter.recordAttempt(email, false);
        
        // Lock account after too many failures
        const failedAttempts = adminRateLimiter.getFailedAttemptsCount(email);
        if (failedAttempts >= 5) {
          adminRateLimiter.lockAccount(email);
        }

        await loginAttemptLogger.logAttempt({
          email,
          success: false,
          errorMessage: error.message,
          attemptType: 'admin',
        });

        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Record successful attempt
        adminRateLimiter.recordAttempt(email, true);

        // Create session
        const session = adminSessionManager.createSession(email, 'admin');

        // Log successful login
        await loginAttemptLogger.logAttempt({
          email,
          success: true,
          attemptType: 'admin',
        });

        // Set up session expiration handlers
        adminSessionManager.onExpired(() => {
          set({
            user: null,
            isAdminAuthenticated: false,
            error: 'Session expired. Please log in again.',
          });
        });

        set({
          user: data.user,
          isAdminAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      
      await loginAttemptLogger.logAttempt({
        email,
        success: false,
        errorMessage: message,
        attemptType: 'admin',
      });

      set({ error: message, isLoading: false });
      return false;
    }
  },

  staffLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null, accountLocked: false });
    
    try {
      // Check rate limiting
      if (!staffRateLimiter.canAttemptLogin(email)) {
        const timeRemaining = staffRateLimiter.getLockoutTimeRemaining(email);
        const message = `Account temporarily locked. Try again in ${timeRemaining} seconds.`;
        
        await loginAttemptLogger.logAttempt({
          email,
          success: false,
          errorMessage: message,
          attemptType: 'staff',
        });

        set({
          error: message,
          isLoading: false,
          accountLocked: true,
          lockoutTimeRemaining: timeRemaining,
        });
        return false;
      }

      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        staffRateLimiter.recordAttempt(email, false);
        
        // Lock account after too many failures
        const failedAttempts = staffRateLimiter.getFailedAttemptsCount(email);
        if (failedAttempts >= 5) {
          staffRateLimiter.lockAccount(email);
        }

        const errorMsg = 'Invalid email or password';
        await loginAttemptLogger.logAttempt({
          email,
          success: false,
          errorMessage: errorMsg,
          attemptType: 'staff',
        });

        set({ error: errorMsg, isLoading: false });
        return false;
      }

      // Record successful attempt
      staffRateLimiter.recordAttempt(email, true);

      // Create secure session
      const session = staffSessionManager.createSession(email, data.role);

      // Log successful login
      await loginAttemptLogger.logAttempt({
        email,
        success: true,
        attemptType: 'staff',
      });

      // Set up session expiration handlers
      staffSessionManager.onExpired(() => {
        set({
          staffRole: null,
          isStaffAuthenticated: false,
          error: 'Session expired. Please log in again.',
        });
        staffSessionManager.clearSession();
      });

      set({
        staffRole: data.role,
        isStaffAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      
      await loginAttemptLogger.logAttempt({
        email,
        success: false,
        errorMessage: message,
        attemptType: 'staff',
      });

      set({ error: message, isLoading: false });
      return false;
    }
  },

  staffLogout: () => {
    staffSessionManager.clearSession();
    set({
      staffRole: null,
      isStaffAuthenticated: false,
    });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      adminSessionManager.clearSession();
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

      if (data.session?.user && adminSessionManager.isSessionValid()) {
        adminSessionManager.updateActivity();
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

      // Check staff session
      const staffSession = staffSessionManager.getSession();
      if (staffSession && staffSessionManager.isSessionValid()) {
        staffSessionManager.updateActivity();
        set({ staffRole: staffSession.role, isStaffAuthenticated: true });
      } else {
        set({ staffRole: null, isStaffAuthenticated: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));