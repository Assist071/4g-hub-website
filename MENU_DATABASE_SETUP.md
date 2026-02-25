# Menu Database Integration - Quick Start Guide

## What Was Added

### 1. Menu Store (`src/store/menuStore.ts`)
- Zustand store for managing menu items and categories
- Fetches data from Supabase `menu_items` and `menu_categories` tables
- Methods: `addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `addMenuCategory`, `updateMenuCategory`, `deleteMenuCategory`
- Loading and error states included

### 2. Menu Data Hook (`src/hooks/useMenuData.ts`)
- Custom React hook that auto-fetches menu data on component mount
- Returns `menuItems`, `menuCategories`, `loading`, and `error` states

### 3. Admin Menu Management Component (`src/components/AdminMenuManagement.tsx`)
- Complete UI for managing menu items and categories
- Features:
  - Add new menu items with full details
  - Edit existing menu items
  - Delete menu items with confirmation
  - Add new categories
  - Delete categories
  - Real-time updates

### 4. Updated Menu Page (`src/pages/Menu.tsx`)
- Now fetches data from Supabase instead of hardcoded data
- Shows loading state while fetching
- Shows error state if fetch fails
- Uses the new `useMenuData` hook

### 5. Database Schema (in `SUPABASE_SETUP.md`)
- `menu_categories` table structure
- `menu_items` table structure  
- Row-Level Security policies
- Sample data initialization script

## Setup Instructions

### 1. Create Supabase Tables
Run these SQL queries in your Supabase SQL Editor:

**Menu Categories Table:**
```sql
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🍽️',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Menu Items Table:**
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category UUID NOT NULL REFERENCES menu_categories(id),
  image TEXT,
  available BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  customization JSONB[] DEFAULT ARRAY[]::jsonb[],  -- Changed from TEXT[]
  flavors TEXT[] DEFAULT '{}',                      -- Add this if missing
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

For complete setup with RLS and sample data, see `SUPABASE_SETUP.md` Step 7-8.

### 2. Enable RLS Policies
Copy the RLS policies from `SUPABASE_SETUP.md` Step 7 into the SQL Editor.

### 3. Add Sample Data (Optional)
Run the seed queries from `SUPABASE_SETUP.md` Step 7 (last section).

### 4. Use in Your Components
```tsx
import { useMenuData } from '@/hooks/useMenuData';

export function MyComponent() {
  const { menuItems, menuCategories, loading, error } = useMenuData();
  
  // Use menuItems and menuCategories...
}
```

## Using Admin Menu Management

### Route Integration
Add this to your admin pages:
```tsx
import { AdminMenuManagement } from '@/components/AdminMenuManagement';

export default function AdminPage() {
  return <AdminMenuManagement />;
}
```

### Features Available
- **Add Items**: Click "Add Item" button to create new menu items
- **Edit Items**: Click edit icon (✏️) on any item card
- **Delete Items**: Click delete icon (🗑️) for confirmation delete
- **Add Categories**: Click "Add Category" to create new categories
- **Delete Categories**: Click delete icon on category cards

## Database Operations

### Add Menu Item
```typescript
const { addMenuItem } = useMenuStore();

await addMenuItem({
  name: 'Pizza',
  description: 'Delicious pizza',
  price: 25.99,
  category: 'meals-id',
  available: true
});
```

### Update Menu Item
```typescript
const { updateMenuItem } = useMenuStore();

await updateMenuItem('item-id', {
  price: 29.99,
  available: false
});
```

### Delete Menu Item
```typescript
const { deleteMenuItem } = useMenuStore();

await deleteMenuItem('item-id');
```

### Add Category
```typescript
const { addMenuCategory } = useMenuStore();

await addMenuCategory({
  name: 'Appetizers',
  description: 'Starting dishes',
  icon: '🥗'
});
```

### Fetch Data
```typescript
const { fetchMenuItems, fetchMenuCategories } = useMenuStore();

await fetchMenuItems();
await fetchMenuCategories();
```

## Troubleshooting

### Menu Not Loading
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Check Supabase project status
- Verify tables exist in Supabase
- Check browser console for errors

### Can't Add/Edit Items
- Ensure you're authenticated
- Verify RLS policies allow your user role
- Check that all required fields are filled

### Category Not Showing in Dropdown
- Refresh the page
- Verify category exists in Supabase
- Check that RLS allows SELECT access

## File Structure
```
src/
├── components/
│   └── AdminMenuManagement.tsx     # Menu management UI
├── hooks/
│   └── useMenuData.ts             # Auto-fetch hook
├── pages/
│   └── Menu.tsx                    # Updated to use Supabase
└── store/
    └── menuStore.ts               # Zustand menu store
```

## Next Steps
1. Migrate existing menu items to Supabase
2. Add image upload functionality
3. Implement pricing tiers
4. Add seasonal items
5. Create menu export/import features

## Environment Variables Required
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

See `SUPABASE_SETUP.md` for complete setup instructions.
