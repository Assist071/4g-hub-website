# Supabase Authentication Setup Guide

## Overview
Your application now uses Supabase for admin authentication instead of local password storage. This provides enterprise-grade security with email/password authentication.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Project Name**: Something like "HubFoodFlow"
   - **Database Password**: Create a strong password (save this for later)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to finish initializing (3-5 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** (bottom left)
2. Click on **API** in the sidebar
3. You'll see two keys:
   - **Project URL** - Copy this
   - **anon (public)** key - Copy this (under "Project API keys")
   
   Keep the **service_role** secret key safe but don't share it or commit it to Git.

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Create Admin User in Supabase

1. In your Supabase project, go to **Authentication** (left sidebar)
2. Click on the **Users** tab
3. Click **Add User** (top right)
4. Fill in:
   - **Email**: admin@example.com (or your admin email)
   - **Password**: Create a strong password
   - Toggle "Auto confirm user" to ON
5. Click **Create User**

## Step 5: Enable Passwordless Auth (Optional)

For added security, you can enable additional auth methods:
- Magic Links (email-only sign in)
- Social authentication (Google, GitHub, etc.)

Go to **Authentication** → **Providers** to enable these.

## Step 6: Security Policies (Advanced)

For production, you should:
1. Create a `admin_users` table to track which users are admins
2. Set up Row-Level Security (RLS) policies
3. Use the service_role key for backend operations only

### Example: Create Admin Users Table

In Supabase SQL Editor, run:

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only viewing own data
CREATE POLICY "Users can view their own admin status"
  ON admin_users
  FOR SELECT
  USING (auth.uid() = id);
```

Then insert your admin user:
```sql
INSERT INTO admin_users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@example.com';
```

## Step 7: Create Menu Database Tables

For the menu management system, create the following tables in Supabase SQL Editor:

### Create Menu Categories Table
```sql
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🍽️',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Enable read access for all users"
  ON menu_categories FOR SELECT
  USING (true);

-- Create policy to allow only admins to modify
CREATE POLICY "Enable insert for authenticated users only"
  ON menu_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
  ON menu_categories FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only"
  ON menu_categories FOR DELETE
  USING (auth.role() = 'authenticated');
```

### Create Menu Items Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  image TEXT,
  available BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  customization TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Enable read access for all users"
  ON menu_items FOR SELECT
  USING (true);

-- Create policy to allow only admins to modify
CREATE POLICY "Enable insert for authenticated users only"
  ON menu_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
  ON menu_items FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only"
  ON menu_items FOR DELETE
  USING (auth.role() = 'authenticated');
```

### Seed Initial Data (Optional)
```sql
-- Insert default categories
INSERT INTO menu_categories (name, description, icon) VALUES
  ('Drinks', 'Refreshing beverages', '🥤'),
  ('Snacks', 'Quick bites', '🍿'),
  ('Meals', 'Full meals', '🍽️'),
  ('Desserts', 'Sweet treats', '🍰')
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, available) VALUES
  ('Coke (in can)', 'Chilled Coca-Cola softdrink', 15.00, 
    (SELECT id FROM menu_categories WHERE name = 'Drinks'), true),
  ('Iced Coffee', 'Ready-to-drink iced coffee', 25.00, 
    (SELECT id FROM menu_categories WHERE name = 'Drinks'), true),
  ('Potato Chips', 'Assorted flavored chips', 10.00, 
    (SELECT id FROM menu_categories WHERE name = 'Snacks'), true),
  ('Cup Noodles', 'Instant cup noodles (beef/chicken)', 17.00, 
    (SELECT id FROM menu_categories WHERE name = 'Snacks'), true)
ON CONFLICT DO NOTHING;
```

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173/admin-login`
3. Enter the email and password you created in Step 4
4. You should be redirected to `/admin` if login is successful
5. Go to the Admin Menu Management page to manage menu items
6. You can now use your app with Supabase auth!

## Step 9: Using the Menu Management System

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure `.env.local` exists in your project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart your dev server after updating `.env.local`

### "Invalid email or password" Error
- Verify the email and password are correct
- Make sure the user was "Auto confirmed" in Supabase
- Check that the user exists in Supabase Authentication → Users

### Session Persists After Logout
- Supabase stores sessions in localStorage by default
- This is normal and provides a better UX
- Users are still protected by their session token

### CORS Errors
- Make sure your Supabase URL is correct (starts with https://)
- Check that the anon key is correct

## File Structure

```
src/
├── store/
│   ├── authStore.ts          # Auth state management (Supabase)
│   └── orderStore.ts          # Order state management
├── lib/
│   └── supabase.ts            # Supabase client config
├── components/
│   ├── AdminLogin.tsx         # Updated for Supabase
│   ├── ProtectedRoute.tsx     # Auth check component
│   └── Navigation.tsx         # Updated for auth store
└── App.tsx                    # Updated with auth check
```

## Key Changes Made

1. **New Auth Store** (`authStore.ts`): Manages Supabase authentication
2. **ProtectedRoute**: Redirects unauthenticated users to `/admin-login`
3. **AdminLogin Component**: Now uses email/password from Supabase
4. **Navigation**: Uses auth store for logout functionality
5. **App.tsx**: Checks authentication on app load
6. **Environment Variables**: Required for Supabase connection

## Step 9: Using the Menu Management System

The menu management system (`AdminMenuManagement` component) provides a user-friendly interface for managing menu items and categories:

### Features
- **Add Menu Items**: Create new items with name, description, price, category
- **Update Menu Items**: Edit existing items with the edit button
- **Delete Menu Items**: Remove items with confirmation
- **Add Categories**: Create new menu categories
- **Delete Categories**: Remove categories with confirmation
- **Availability Toggle**: Mark items as available/unavailable

### Accessing Menu Management
1. Log in as admin at `/admin-login`
2. Navigate to the admin panel
3. Look for the "Menu Management" section
4. Use the interface to manage your menu

### How to Add a New Item
1. Click "Add Item" button
2. Fill in the item details:
   - **Name**: Item name (required)
   - **Description**: Brief description
   - **Price**: Item price (required)
   - **Category**: Select category (required)
   - **Available**: Toggle availability
3. Click "Add Item" to save

### How to Update an Item
1. Find the item in the Menu Items section
2. Click the edit icon (pencil)
3. Modify the details
4. Click "Update Item"

### How to Delete an Item
1. Find the item in the Menu Items section
2. Click the trash icon
3. Confirm the deletion

## File Structure

```
src/
├── store/
│   ├── authStore.ts              # Auth state management (Supabase)
│   ├── orderStore.ts             # Order state management
│   └── menuStore.ts              # Menu state management (NEW)
├── lib/
│   └── supabase.ts               # Supabase client config
├── components/
│   ├── AdminLogin.tsx            # Updated for Supabase
│   ├── AdminMenuManagement.tsx   # Menu management (NEW)
│   ├── ProtectedRoute.tsx        # Auth check component
│   └── Navigation.tsx            # Updated for auth store
└── App.tsx                       # Updated with auth check
```

## Key Changes Made

1. **New Auth Store** (`authStore.ts`): Manages Supabase authentication
2. **New Menu Store** (`menuStore.ts`): Manages menu items and categories from Supabase
3. **AdminMenuManagement Component**: UI for managing menu items and categories
4. **ProtectedRoute**: Redirects unauthenticated users to `/admin-login`
5. **AdminLogin Component**: Now uses email/password from Supabase
6. **Navigation**: Uses auth store for logout functionality
7. **App.tsx**: Checks authentication on app load
8. **Environment Variables**: Required for Supabase connection
9. **Database Tables**: `menu_items` and `menu_categories` tables in Supabase

## Next Steps

After successful setup:
1. Create additional admin users as needed
2. Implement custom claims or admin status checks
3. Set up Row-Level Security for sensitive data
4. Consider adding MFA (Multi-Factor Authentication)
5. Set up email confirmations and password reset flows
6. Add image uploads for menu items
7. Implement pricing tiers or seasonal items

## Troubleshooting Menu Management

### Menu Items Not Loading
- Check that you've created the `menu_items` table
- Verify Row-Level Security policies are set correctly
- Check browser console for error messages

### Can't Add/Update/Delete Items
- Ensure you're logged in as admin
- Verify your authentication token is valid
- Check that Row-Level Security policies allow inserts/updates/deletes

### Category Not Appearing in Dropdown
- Make sure the category exists in the `menu_categories` table
- Try refreshing the page if you just added a new category

## Support

For more information:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase React Integration](https://supabase.com/docs/guides/auth/social-oauth/auth-google?queryGroups=language&language=javascript&queryGroups=framework&framework=react)
- [Zustand Documentation](https://github.com/pmndrs/zustand) - State management library
