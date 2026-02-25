/**
 * Session Manager - Handles secure session management with timeouts
 */

interface SessionConfig {
  sessionTimeout: number; // in milliseconds
  warningTime: number; // warn before this time
  storageKey: string;
}

interface Session {
  id: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // warn at 5 minutes
  storageKey: 'admin_session',
};

class SessionManager {
  private config: SessionConfig;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onSessionWarning: ((timeRemaining: number) => void) | null = null;
  private onSessionExpired: (() => void) | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new session
   */
  createSession(email: string, role: string): Session {
    const id = this.generateSessionId();
    const now = Date.now();
    const session: Session = {
      id,
      email,
      role,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.sessionTimeout,
    };

    this.storeSession(session);
    this.startSessionCheck();
    return session;
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    const sessionData = sessionStorage.getItem(this.config.storageKey);
    if (!sessionData) return null;

    try {
      return JSON.parse(sessionData) as Session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * Update last activity time (resets inactivity timer)
   */
  updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      session.expiresAt = Date.now() + this.config.sessionTimeout;
      this.storeSession(session);
    }
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check if expired
    if (Date.now() > session.expiresAt) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Get time remaining in session (in milliseconds)
   */
  getTimeRemaining(): number {
    const session = this.getSession();
    if (!session) return 0;

    const remaining = session.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    sessionStorage.removeItem(this.config.storageKey);
    this.stopSessionCheck();
  }

  /**
   * Store session in sessionStorage (not localStorage for security)
   */
  private storeSession(session: Session): void {
    sessionStorage.setItem(this.config.storageKey, JSON.stringify(session));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start checking session validity
   */
  private startSessionCheck(): void {
    if (this.sessionCheckInterval) return;

    this.sessionCheckInterval = setInterval(() => {
      const session = this.getSession();
      if (!session) {
        this.stopSessionCheck();
        return;
      }

      const timeRemaining = session.expiresAt - Date.now();

      // Session expired
      if (timeRemaining <= 0) {
        this.clearSession();
        this.onSessionExpired?.();
      }
      // Show warning
      else if (
        timeRemaining <= this.config.warningTime &&
        timeRemaining > this.config.warningTime - 1000
      ) {
        this.onSessionWarning?.(timeRemaining);
      }
    }, 1000);
  }

  /**
   * Stop checking session
   */
  private stopSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Register callback for session warning
   */
  onWarning(callback: (timeRemaining: number) => void): void {
    this.onSessionWarning = callback;
  }

  /**
   * Register callback for session expiration
   */
  onExpired(callback: () => void): void {
    this.onSessionExpired = callback;
  }
}

export const adminSessionManager = new SessionManager({
  sessionTimeout: 30 * 60 * 1000, // 30 minutes for admin
  warningTime: 5 * 60 * 1000,
  storageKey: 'admin_session',
});

export const staffSessionManager = new SessionManager({
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours for staff
  warningTime: 15 * 60 * 1000, // 15 minute warning
  storageKey: 'staff_session',
});

export type { Session, SessionConfig };
