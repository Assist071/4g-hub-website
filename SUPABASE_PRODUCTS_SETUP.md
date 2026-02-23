# Supabase Products Setup Guide

This guide covers setting up the `products` table in Supabase for the image upload and product management system.

## Prerequisites

- Supabase project created
- Supabase Storage bucket named `products` (public) already configured
- Admin access to Supabase dashboard

## Step 1: Create Products Table

Run this SQL in the Supabase SQL editor to create the products table:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT price_positive CHECK (price > 0),
  CONSTRAINT name_not_empty CHECK (name != '')
);

-- Create indexes for better query performance
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_name ON products(name);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Allow public to read all products
CREATE POLICY "Enable read access for all users" ON products
  FOR SELECT USING (true);

-- Allow authenticated users to insert products
CREATE POLICY "Enable insert for authenticated users" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own products
CREATE POLICY "Enable update for product creators" ON products
  FOR UPDATE USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own products
CREATE POLICY "Enable delete for product creators" ON products
  FOR DELETE USING (auth.uid() = created_by);

-- Optionally: Create a view for admin-specific operations
CREATE OR REPLACE VIEW product_stats AS
SELECT 
  COUNT(*) as total_products,
  AVG(price) as average_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM products;
```

## Step 2: Configure Storage

The `products` storage bucket should already be created with the following settings:

- **Bucket Name:** `products`
- **Privacy:** Public
- **Folder:** If using subfolders, create one like `/images/` for organization

## Step 3: Create Products Storage Policies

Run this SQL to configure storage access:

```sql
-- Allow public to read from products bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for reads
CREATE POLICY "Enable read access to products bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Create storage policy for authenticated users to upload
CREATE POLICY "Enable authenticated users to upload to products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policy for authenticated users to update their uploads
CREATE POLICY "Enable authenticated users to update their uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products'
    AND auth.uid() = owner
  );

-- Create storage policy for authenticated users to delete their uploads
CREATE POLICY "Enable authenticated users to delete their uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products'
    AND auth.uid() = owner
  );
```

## Step 4: Verify Setup

1. Go to **Table Editor** → **products** table
   - Confirm all columns are present
   - Verify constraints are listed

2. Go to **Storage** → **products** bucket
   - Confirm bucket is public
   - Test uploading a file

3. Go to **SQL Editor** → Run test query:

```sql
-- Test fetching products
SELECT * FROM products ORDER BY created_at DESC LIMIT 10;
```

## Step 5: Frontend Integration Examples

### Fetching Products

```typescript
// Using the useProducts hook
import { useProducts } from '@/hooks/useProducts';

function ProductsPage() {
  const { products, isLoading, error } = useProducts();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <ProductGrid products={products} />;
}
```

### Uploading Products

```typescript
// Using ProductUploadForm component
import { ProductUploadForm } from '@/components/ProductUploadForm';

function AdminPanel() {
  const handleUploadSuccess = () => {
    console.log('Product uploaded successfully');
    // Refresh products list
  };

  return (
    <ProductUploadForm onUploadSuccess={handleUploadSuccess} />
  );
}
```

### Data Flow

1. **Upload:** User selects image → Browser compresses → Supabase Storage → Returns public URL
2. **Store:** Product data (name, description, price, image_url) saved to `products` table
3. **Fetch:** useProducts hook queries `products` table → ProductGrid displays results
4. **Display:** Product images rendered from Supabase public URL with 1:1 aspect ratio

## Step 6: Environment Variables

Ensure your `.env.local` contains Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Table Schema Reference

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | - | Product details |
| price | DECIMAL(10, 2) | NOT NULL, > 0 | Product price |
| image_url | TEXT | - | URL to product image in Supabase Storage |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FK to auth.users | Creator user ID |

## Troubleshooting

### "Table does not exist" Error
- Verify SQL was executed successfully
- Check table exists in Table Editor
- Reload the page

### "Permission denied" Error
- Check RLS policies are created
- Verify user is authenticated (if required)
- Check storage bucket policies

### Images Not Displaying
- Verify `image_url` is complete Supabase public URL
- Check storage bucket is public
- Verify file exists in storage bucket

### Upload Fails
- Check `image_url` column exists in products table
- Verify authenticated user has insert permission
- Check file size is within limits

## Advanced: Backup SQL Script

Save this as `products_schema.sql` for easy recreation:

```sql
-- Products table with all RLS policies
-- Generated for Supabase

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT price_positive CHECK (price > 0),
  CONSTRAINT name_not_empty CHECK (name != '')
);

-- Indexes
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_name ON products(name);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for product creators" ON products FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Enable delete for product creators" ON products FOR DELETE USING (auth.uid() = created_by);
```

## Next Steps

1. ✅ Create products table with schema
2. ✅ Configure RLS policies
3. ✅ Verify storage bucket settings
4. 👉 Use ProductUploadForm to add products
5. 👉 Display products with ProductGrid component
6. 👉 Integrate with existing menu system

## Additional Resources

- [Supabase Product Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Configuration](https://supabase.com/docs/guides/storage)
- [Real-time Features](https://supabase.com/docs/guides/realtime)
