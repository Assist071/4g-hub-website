/**
 * Login Attempt Logger
 * Logs failed login attempts for security monitoring
 */

import { supabase } from './supabase';

export interface LoginAttemptRecord {
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  errorMessage?: string;
  attemptType: 'admin' | 'staff';
}

class LoginAttemptLogger {
  /**
   * Log login attempt to database
   */
  async logAttempt(record: Omit<LoginAttemptRecord, 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    try {
      // Get browser info (these are available from client)
      const userAgent = navigator.userAgent;

      const logEntry = {
        email: record.email,
        success: record.success,
        user_agent: userAgent,
        error_message: record.errorMessage || null,
        attempt_type: record.attemptType,
        timestamp: new Date().toISOString(),
      };

      // Log to a login_attempts table
      const { error } = await supabase
        .from('login_attempts')
        .insert([logEntry]);

      if (error) {
        console.error('Failed to log login attempt:', error);
      }
    } catch (err) {
      console.error('Error logging login attempt:', err);
    }
  }

  /**
   * Check for suspicious activity (multiple failed logins)
   */
  async checkSuspiciousActivity(email: string, attemptType: 'admin' | 'staff'): Promise<{
    isSuspicious: boolean;
    failedAttempts: number;
    lastAttempt?: Date;
  }> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('login_attempts')
        .select('timestamp')
        .eq('email', email)
        .eq('success', false)
        .eq('attempt_type', attemptType)
        .gt('timestamp', thirtyMinutesAgo)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error checking suspicious activity:', error);
        return { isSuspicious: false, failedAttempts: 0 };
      }

      const failedAttempts = data?.length || 0;
      const isSuspicious = failedAttempts >= 5;

      return {
        isSuspicious,
        failedAttempts,
        lastAttempt: data?.[0] ? new Date(data[0].timestamp) : undefined,
      };
    } catch (err) {
      console.error('Error in checkSuspiciousActivity:', err);
      return { isSuspicious: false, failedAttempts: 0 };
    }
  }

  /**
   * Get recent login activity for user
   */
  async getRecentActivity(email: string, attemptType: 'admin' | 'staff', limit: number = 10): Promise<LoginAttemptRecord[]> {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .eq('attempt_type', attemptType)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activity:', error);
        return [];
      }

      return data?.map((record: any) => ({
        email: record.email,
        success: record.success,
        timestamp: new Date(record.timestamp).getTime(),
        errorMessage: record.error_message,
        attemptType: record.attempt_type,
        userAgent: record.user_agent,
      })) || [];
    } catch (err) {
      console.error('Error in getRecentActivity:', err);
      return [];
    }
  }
}

export const loginAttemptLogger = new LoginAttemptLogger();
