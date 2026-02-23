-- ============================================
-- ADMIN USERS TABLE SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Policy 1: Admin users can view their own admin status
CREATE POLICY "Users can view their own admin status"
  ON admin_users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Only service role can insert/update/delete (admin management)
CREATE POLICY "Only service role can manage admin users"
  ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Add comment to table
COMMENT ON TABLE admin_users IS 'Tracks authorized admin users for the application';

-- ============================================
-- INSERT YOUR ADMIN USER
-- ============================================
-- Replace 'your-admin-email@example.com' with your actual admin email
-- This assumes you already have a user in auth.users with this email

INSERT INTO admin_users (id, email, role, is_active)
SELECT id, email, 'admin', true
FROM auth.users
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFY SETUP
-- ============================================
-- View all admin users
SELECT id, email, role, is_active, created_at 
FROM admin_users;

-- View all users (to find your admin user's email)
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================
-- OPTIONAL: ADD MORE ADMIN USERS LATER
-- ============================================
-- To add another admin user, first create them in Auth, then run:
-- INSERT INTO admin_users (id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'new-admin@example.com'
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- OPTIONAL: CHECK ADMIN STATUS IN APP
-- ============================================
-- You can create a function to check if a user is admin:
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then query it like:
-- SELECT is_admin(auth.uid());
