/**
 * Rate Limiter for login attempts
 * Prevents brute force attacks by limiting login attempts
 */

interface LoginAttempt {
  timestamp: number;
  email: string;
  success: boolean;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes

class RateLimiter {
  private attempts: LoginAttempt[] = [];
  private lockedAccounts: Map<string, number> = new Map();

  /**
   * Check if an email is locked due to too many failed attempts
   */
  isAccountLocked(email: string): boolean {
    const lockTime = this.lockedAccounts.get(email);
    if (!lockTime) return false;

    const now = Date.now();
    if (now - lockTime > LOCKOUT_DURATION) {
      this.lockedAccounts.delete(email);
      return false;
    }

    return true;
  }

  /**
   * Get remaining lockout time in seconds
   */
  getLockoutTimeRemaining(email: string): number {
    const lockTime = this.lockedAccounts.get(email);
    if (!lockTime) return 0;

    const remaining = LOCKOUT_DURATION - (Date.now() - lockTime);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Record a login attempt
   */
  recordAttempt(email: string, success: boolean): void {
    const now = Date.now();
    this.attempts.push({ timestamp: now, email, success });

    // Clean up old attempts (outside the time window)
    this.attempts = this.attempts.filter(
      (attempt) => now - attempt.timestamp < TIME_WINDOW
    );
  }

  /**
   * Check if login attempt is allowed
   */
  canAttemptLogin(email: string): boolean {
    if (this.isAccountLocked(email)) {
      return false;
    }

    const now = Date.now();
    const recentFailures = this.attempts.filter(
      (attempt) =>
        attempt.email === email &&
        !attempt.success &&
        now - attempt.timestamp < TIME_WINDOW
    ).length;

    return recentFailures < MAX_ATTEMPTS;
  }

  /**
   * Get failed attempts count for email within time window
   */
  getFailedAttemptsCount(email: string): number {
    const now = Date.now();
    return this.attempts.filter(
      (attempt) =>
        attempt.email === email &&
        !attempt.success &&
        now - attempt.timestamp < TIME_WINDOW
    ).length;
  }

  /**
   * Lock account after too many failed attempts
   */
  lockAccount(email: string): void {
    this.lockedAccounts.set(email, Date.now());
  }

  /**
   * Clear all records (for testing or manual reset)
   */
  clear(): void {
    this.attempts = [];
    this.lockedAccounts.clear();
  }
}

export const adminRateLimiter = new RateLimiter();
export const staffRateLimiter = new RateLimiter();
