# Staff Users Setup Guide

## Overview
This guide explains how to set up the `staff_users` table in Supabase for managing staff members with role-based access.

## Step 1: Create the staff_users Table

Go to your Supabase project dashboard and run the following SQL in the SQL Editor:

```sql
-- Create staff_users table
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('staff', 'chef', 'manager', 'cashier')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read staff_users (for login)
CREATE POLICY "Allow public read" ON staff_users
  FOR SELECT
  USING (true);

-- Create policy to allow admin to insert/update/delete
CREATE POLICY "Allow admin full access" ON staff_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create an index on email for faster lookups
CREATE INDEX idx_staff_users_email ON staff_users(email);
```

## Step 2: Understand Staff Roles

- **Staff**: Basic staff member - can view Order Queue, Kitchen, and Dashboard
- **Chef**: Kitchen staff - focused on food preparation
- **Manager**: Can manage staff and view analytics
- **Cashier**: Handles payments and order confirmations

## Step 3: Add Staff Users via Admin Dashboard

1. Log in to your **Admin Panel**
2. Go to **Overview Tab** → **System Controls** → **Manage Users**
3. Fill in:
   - **Email**: staff@example.com
   - **Role**: Choose from Staff, Manager, Chef, or Cashier
   - **Password**: Create a strong password
4. Click **Add User**

The user will be automatically saved to the Supabase database.

## Step 4: Staff Login

1. Staff members visit the home page `/` 
2. Click **Staff Login**
3. Enter their email and password
4. They'll be logged in and can access:
   - Order Queue (view pending orders)
   - Kitchen Dashboard (see food preparation status)
   - Main Dashboard (view analytics)

## Access Control by Role

### Staff Role
- ✅ Order Queue
- ✅ Kitchen Dashboard
- ✅ Dashboard
- ❌ Admin Panel

### Other Roles (Manager, Chef, Cashier)
Currently have same access as Staff. You can customize this in code by updating the Navigation component and adding role-specific checks.

## Important Security Notes

⚠️ **Password Storage**: Passwords are stored in plain text in this demo. For production:
- Use Supabase Password Hasher (install bcrypt)
- Hash passwords before storing
- Consider using Supabase Auth instead

⚠️ **RLS Policies**: Update the RLS policies based on your security requirements

⚠️ **Environment Variables**: Keep your Supabase credentials secure in `.env.local`

## Example: Adding Test Users

```sql
INSERT INTO staff_users (email, password, role) VALUES
  ('chef@example.com', 'password123', 'chef'),
  ('manager@example.com', 'password123', 'manager'),
  ('cashier@example.com', 'password123', 'cashier'),
  ('staff@example.com', 'password123', 'staff');
```

## Troubleshooting

**"Invalid email or password"**
- Check that the email and password match exactly
- Ensure the user exists in the staff_users table

**"Failed to connect to database"**
- Verify Supabase connection is working
- Check `.env.local` has correct credentials
- Ensure the staff_users table exists

**Can't see Staff Login button**
- Clear browser cache (Ctrl+F5)
- Verify Landing.tsx changes were saved
- Check browser console for errors

## Next Steps

1. Create test staff accounts in the Admin Panel
2. Test login flow with each role
3. Customize role-based access as needed
4. Implement password hashing for production
5. Set up RLS policies for security
