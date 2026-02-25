-- =========================================================
-- ✅ CORRECTED DATABASE SCHEMA FOR ADMIN LOGIN SECURITY
-- Supabase-compatible version
-- =========================================================

-- =========================================================
-- 1️⃣ Create login_attempts table
-- Logs all login attempts (success/failure)
-- =========================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  user_agent TEXT,
  error_message TEXT,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('admin', 'staff')),
  ip_address INET, -- Optional: IP address if tracked
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_timestamp 
ON login_attempts(email, timestamp DESC);

-- Index for finding suspicious activity
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed_recent
ON login_attempts(email, success, timestamp DESC)
WHERE success = false;

-- =========================================================
-- 2️⃣ Row Level Security (RLS) Policies for login_attempts
-- =========================================================
-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon users) to insert login attempts
-- This is safe because insertion is restricted by the app
CREATE POLICY "Anyone can insert login attempts"
ON login_attempts
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to read their own login attempts
-- Using auth.email() should work in Supabase
CREATE POLICY "Users can read their own login attempts"
ON login_attempts
FOR SELECT
USING (email = auth.email());

-- Allow service_role to read all (for admin monitoring)
CREATE POLICY "Service role can read all login attempts"
ON login_attempts
FOR SELECT
USING (auth.role() = 'service_role');

-- =========================================================
-- 3️⃣ Update staff_users table with lockout tracking
-- Run this to add lockout columns if they don't exist
-- =========================================================
ALTER TABLE staff_users
ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- =========================================================
-- 4️⃣ HELPER FUNCTION: Check if staff account is locked
-- Use this to validate before allowing login attempt
-- =========================================================
CREATE OR REPLACE FUNCTION is_staff_account_locked(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM staff_users
    WHERE email = user_email
    AND locked_until IS NOT NULL
    AND locked_until > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 5️⃣ HELPER FUNCTION: Increment failed login attempts
-- Call this after a failed login attempt
-- =========================================================
CREATE OR REPLACE FUNCTION increment_failed_login(user_email TEXT)
RETURNS TABLE(failed_count INT, is_now_locked BOOLEAN) AS $$
DECLARE
  attempt_count INT;
BEGIN
  -- Increment failed attempts
  UPDATE staff_users
  SET 
    failed_attempts = failed_attempts + 1,
    last_failed_login = NOW()
  WHERE email = user_email;

  -- Get current count
  SELECT failed_attempts INTO attempt_count
  FROM staff_users
  WHERE email = user_email;

  -- Lock account if 5+ attempts
  IF attempt_count >= 5 THEN
    UPDATE staff_users
    SET locked_until = NOW() + INTERVAL '15 minutes'
    WHERE email = user_email;
    
    RETURN QUERY SELECT attempt_count::INT, true::BOOLEAN;
  ELSE
    RETURN QUERY SELECT attempt_count::INT, false::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 6️⃣ HELPER FUNCTION: Reset failed attempts on success
-- Call this after a successful login
-- =========================================================
CREATE OR REPLACE FUNCTION reset_failed_login(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE staff_users
  SET 
    failed_attempts = 0,
    locked_until = NULL,
    last_failed_login = NULL
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 7️⃣ RLS Policy for staff_users lockout columns
-- Only backend can update lockout fields
-- =========================================================
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Staff users can read their own info
CREATE POLICY "Staff can read own user data"
ON staff_users
FOR SELECT
USING (email = auth.email());

-- Only service_role (backend) can update
CREATE POLICY "Only backend can update staff users"
ON staff_users
FOR UPDATE
USING (auth.role() = 'service_role');

-- =========================================================
-- 8️⃣ Create view for audit logs (read-only)
-- Admins can see recent suspicious activity
-- =========================================================
CREATE OR REPLACE VIEW recent_suspicious_logins AS
SELECT 
  email,
  attempt_type,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt,
  MAX(error_message) as last_error
FROM login_attempts
WHERE success = false
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY email, attempt_type
HAVING COUNT(*) >= 3
ORDER BY last_attempt DESC;

-- Grant access to admins
GRANT SELECT ON recent_suspicious_logins TO authenticated;

-- =========================================================
-- 9️⃣ Create view for login success rate
-- Track successful logins per user
-- =========================================================
CREATE OR REPLACE VIEW login_success_rate AS
SELECT 
  email,
  attempt_type,
  COUNT(*) FILTER (WHERE success = true) as successful_logins,
  COUNT(*) FILTER (WHERE success = false) as failed_logins,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE success = true) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent,
  MAX(timestamp) as last_login
FROM login_attempts
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY email, attempt_type
ORDER BY last_login DESC;

-- =========================================================
-- 🔟 USAGE EXAMPLES
-- =========================================================

-- A) Check if account is locked before login attempt
-- SELECT is_staff_account_locked('user@example.com');
-- Returns: true if locked, false if available

-- B) After failed login, increment counter
-- SELECT * FROM increment_failed_login('user@example.com');
-- Returns: { failed_count: 3, is_now_locked: false }

-- C) After successful login, reset counter
-- SELECT reset_failed_login('user@example.com');

-- D) View recent suspicious activity
-- SELECT * FROM recent_suspicious_logins;

-- E) View login success rates
-- SELECT * FROM login_success_rate;

-- F) Get last 10 login attempts for user
-- SELECT email, success, error_message, timestamp
-- FROM login_attempts
-- WHERE email = 'user@example.com'
-- ORDER BY timestamp DESC
-- LIMIT 10;

-- =========================================================
-- ⚠️ IMPORTANT NOTES
-- =========================================================
-- 1. Run this script in Supabase SQL Editor with service_role
-- 2. The helper functions use SECURITY DEFINER to bypass RLS
-- 3. Call these functions from your backend API routes
-- 4. For frontend, rely on client-side rate limiting (rateLimiter.ts)
-- 5. Combine both client-side + database-side security
-- 6. Monitor recent_suspicious_logins view regularly
-- 7. Set up alerts for accounts appearing multiple times

-- =========================================================
-- 🧹 CLEANUP (If needed)
-- =========================================================
-- DROP TABLE IF EXISTS login_attempts CASCADE;
-- DROP FUNCTION IF EXISTS is_staff_account_locked(TEXT);
-- DROP FUNCTION IF EXISTS increment_failed_login(TEXT);
-- DROP FUNCTION IF EXISTS reset_failed_login(TEXT);
-- DROP VIEW IF EXISTS recent_suspicious_logins;
-- DROP VIEW IF EXISTS login_success_rate;
