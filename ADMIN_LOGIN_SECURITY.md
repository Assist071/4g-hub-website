    # Admin Login Security Implementation Guide

    ## 🔐 Security Features Implemented

    ### 1. **Rate Limiting**
    - **Max Attempts:** 5 failed login attempts per 15 minutes
    - **Lockout Duration:** 15 minutes after exceeding max attempts
    - **Applies to:** Both admin and staff logins
    - **Location:** `src/lib/rateLimiter.ts`

    ```typescript
    // Example: Check if login is allowed
    if (!adminRateLimiter.canAttemptLogin(email)) {
    // Account is locked
    }
    ```

    ### 2. **Session Management**
    - **Admin Session Timeout:** 30 minutes of inactivity
    - **Staff Session Timeout:** 8 hours of inactivity
    - **Warning Time:** User gets warning 5 minutes before expiration
    - **Storage:** Uses `sessionStorage` instead of `localStorage` (more secure)
    - **Location:** `src/lib/sessionManager.ts`

    ```typescript
    // Sessions are automatically managed
    const session = adminSessionManager.getSession();
    adminSessionManager.updateActivity(); // Reset timeout on user action
    ```

    ### 3. **Login Attempt Logging**
    - Logs all login attempts (successful and failed) to database
    - Records email, timestamp, user agent, error messages
    - Enables detection of suspicious activity
    - Location: `src/lib/loginAttemptLogger.ts`

    ```typescript
    // Automatically logged on every login attempt
    await loginAttemptLogger.logAttempt({
    email: userEmail,
    success: true,
    attemptType: 'admin',
    });
    ```

    ### 4. **Account Lockout Protection**
    - Automatic account lockout after 5 failed attempts
    - Visual feedback showing lockout timer
    - Countdown displayed to user
    - Location: `src/store/authStore.ts`

    ### 5. **Password Security Guidelines**
    - **Minimum Length:** 12 characters
    - **Requirements:**
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character (!@#$%^&*)
    - **Validation Available:** `src/lib/passwordValidation.ts`

    ```typescript
    import { validatePasswordStrength, getPasswordRequirementErrors } from '@/lib/passwordValidation';

    const strength = validatePasswordStrength(password);
    const errors = getPasswordRequirementErrors(password);
    ```

    ### 6. **Secure Error Messages**
    - Generic error messages (don't reveal if email exists)
    - No password hints or recovery suggestions in UI
    - Detailed logging server-side for admin review

    ---

    ## 📋 Database Schema Required

    ### Create `login_attempts` Table
    ```sql
    CREATE TABLE login_attempts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    user_agent TEXT,
    error_message TEXT,
    attempt_type TEXT NOT NULL, -- 'admin' or 'staff'
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (email) REFERENCES auth.users(email) ON DELETE CASCADE
    );

    -- Create index for better query performance
    CREATE INDEX idx_login_attempts_email_timestamp 
    ON login_attempts(email, timestamp DESC);
    ```

    ---

    ## 🔒 Best Practices for Admin Accounts

    ### 1. **Strong Passwords**
    - Use generated passwords: `src/lib/passwordValidation.ts#generateSecurePassword()`
    - Change default passwords immediately
    - Use unique passwords (not reused across services)

    ### 2. **Account Management**
    - Limit number of admin accounts
    - Remove unused admin accounts
    - Regular password rotation (monthly recommended)
    - Enable Supabase MFA if available

    ### 3. **Session Security**
    - Logout from all sessions when suspicious activity detected
    - Don't use public WiFi for admin access
    - Use VPN for additional security

    ### 4. **Monitoring**
    - Review `login_attempts` table regularly
    - Watch for multiple failed attempts from same IP
    - Monitor successful logins from new locations
    - Set up alerts for account lockouts

    ---

    ## 🚀 Usage in Components

    ### Login Component
    Already updated in `src/components/AdminLogin.tsx`:
    ```tsx
    // Automatic rate limiting
    const { login, accountLocked, lockoutTimeRemaining } = useAuthStore();

    // Session auto-expires after timeout
    adminSessionManager.onExpired(() => {
    // User is automatically logged out
    });
    ```

    ### Protected Routes
    Update your `ProtectedRoute.tsx`:
    ```tsx
    import { adminSessionManager } from '@/lib/sessionManager';

    function ProtectedRoute() {
    if (!adminSessionManager.isSessionValid()) {
        return <Navigate to="/login" />;
    }
    
    // Update activity on every interaction
    adminSessionManager.updateActivity();
    return <AdminDashboard />;
    }
    ```

    ---

    ## 📊 Monitoring Dashboard (Optional)

    Create admin dashboard to view:
    ```typescript
    // Get suspicious activity for an email
    const suspicious = await loginAttemptLogger.checkSuspiciousActivity(
    email,
    'admin'
    );

    // Get recent login activity
    const activity = await loginAttemptLogger.getRecentActivity(
    email,
    'admin',
    10 // Last 10 attempts
    );
    ```

    ---

    ## ⚠️ Common Security Mistakes (FIXED)

    ### ❌ Before (Insecure)
    ```typescript
    // Storing plaintext passwords
    const { data } = await supabase
    .from('staff_users')
    .select('*')
    .eq('password', plainPassword); // DANGER!

    // No rate limiting
    // Session stored in localStorage
    localStorage.setItem('user', JSON.stringify(user)); // Vulnerable to XSS
    ```

    ### ✅ After (Secure)
    ```typescript
    // Using Supabase auth (passwords hashed)
    const { data } = await supabase.auth.signInWithPassword({
    email,
    password, // Never stored, only verified
    });

    // With rate limiting
    if (!adminRateLimiter.canAttemptLogin(email)) {
    // Block attempt
    }

    // Session in sessionStorage (cleared on browser close)
    sessionStorage.setItem('session', JSON.stringify(session));
    ```

    ---

    ## 🔄 Environment Variables

    Add to your `.env`:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

    ---

    ## 📱 Session Timeout Reminders

    Add this to show session expiring:
    ```tsx
    import { adminSessionManager } from '@/lib/sessionManager';

    export function SessionWarning() {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        adminSessionManager.onWarning((time) => {
        setTimeRemaining(time);
        toast({
            title: 'Session Expiring',
            description: `Your session expires in ${Math.ceil(time / 1000)} seconds`,
        });
        });
    }, []);

    return null;
    }
    ```

    ---

    ## 🛡️ Additional Recommendations

    1. **Enable HTTPS Only** - Force HTTPS in production
    2. **CSRF Protection** - Implement CSRF tokens
    3. **Content Security Policy** - Add CSP headers
    4. **SQL Injection Protection** - Use parameterized queries (Supabase does this)
    5. **XSS Protection** - Sanitize user input (React does this by default)
    6. **Staff Password Hashing** - Update staff_users table to use hashed passwords
    7. **Two-Factor Authentication** - Consider adding 2FA for admin accounts
    8. **API Rate Limiting** - Implement server-side rate limiting

    ---

    ## 🧪 Testing Security

    Test the rate limiter:
    ```typescript
    // Try 6 failed logins with same email
    for (let i = 0; i < 6; i++) {
    await login('test@example.com', 'wrongpassword');
    }
    // 7th attempt should be blocked
    ```

    ---

    ## 📞 Support

    For issues or questions:
    1. Check login_attempts table for suspicious activity
    2. Review Supabase Authentication logs
    3. Check browser console for errors
    4. Verify sessionStorage is enabled

    ---

    Last Updated: February 25, 2026
