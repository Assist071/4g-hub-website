import React from 'react';

# Complete Implementation Guide

This guide shows how to integrate the new Products system (ProductUploadForm, ProductGrid, useProducts) with your existing application.

## 1. File Structure

```
src/
├── components/
│   ├── ProductGrid.tsx          ✨ NEW - Display products in grid
│   ├── ProductUploadForm.tsx    ✨ NEW - Upload form with image compression
│   └── ...
├── hooks/
│   ├── useProducts.ts           ✨ NEW - Fetch products from Supabase
│   ├── useImageCompression.ts   ✨ NEW - Browser-based image compression
│   ├── useImageUpload.ts        ✨ NEW - Supabase Storage upload
│   └── ...
└── pages/
    ├── ProductsManagement.tsx   ✨ NEW - Admin products management
    └── ...
```

## 2. Component Integration

### Use Case 1: Admin Product Management Page

```typescript
// pages/AdminProducts.tsx
import { ProductUploadForm } from '@/components/ProductUploadForm';
import { ProductGrid } from '@/components/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

export default function AdminProducts() {
  const { products, isLoading, refetch } = useProducts();

  return (
    <div className="space-y-6">
      <ProductUploadForm 
        onUploadSuccess={() => refetch()} 
      />
      <ProductGrid products={products} isLoading={isLoading} />
    </div>
  );
}
```

### Use Case 2: Customer Browsing Page

```typescript
// pages/Browse.tsx
import { ProductGrid } from '@/components/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useOrderStore } from '@/store/orderStore';

export default function BrowseProducts() {
  const { products, isLoading } = useProducts();
  const { addItem } = useOrderStore();

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <ProductGrid 
      products={products} 
      isLoading={isLoading}
      onAddToCart={handleAddToCart}
    />
  );
}
```

### Use Case 3: Search/Filter Integration

```typescript
// pages/Menu.tsx (Enhanced)
import { useState, useMemo } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MenuPage() {
  const { products, isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredProducts = useMemo(() => {
    let results = products;

    // Filter by search term
    if (searchTerm) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return results;
  }, [products, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:flex-1"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="price_low">Price (Low-High)</SelectItem>
            <SelectItem value="price_high">Price (High-Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <ProductGrid 
        products={filteredProducts} 
        isLoading={isLoading}
      />
    </div>
  );
}
```

## 3. Database Integration Patterns

### Pattern 1: Separate Products Table (Recommended)

Your current setup uses a separate `products` table. This is ideal for:
- Inventory management independent of menu
- Easy product categorization
- Flexible pricing and promotions

```sql
-- products table (already set up)
SELECT * FROM products;

-- Join with categories if needed
SELECT p.*, c.name as category
FROM products p
LEFT JOIN product_categories c ON p.category_id = c.id;
```

### Pattern 2: Extend menu_items with Images (Alternative)

If you want to integrate with existing menu system:

```sql
-- Migrate products to menu_items
INSERT INTO menu_items (name, description, price, image_url, is_available)
SELECT name, description, price, image_url, true FROM products;
```

## 4. Store Integration

### Add to Order Store

Update your order/cart store to work with products:

```typescript
// store/orderStore.ts (Updated)
import create from 'zustand';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
}

export const useOrderStore = create((set) => ({
  items: [] as OrderItem[],

  addItem: (item: OrderItem) =>
    set((state) => {
      const exists = state.items.find(i => i.id === item.id);
      if (exists) {
        return {
          items: state.items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (id: string) =>
    set((state) => ({
      items: state.items.filter(i => i.id !== id),
    })),

  updateQuantity: (id: string, quantity: number) =>
    set((state) => ({
      items: state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      ),
    })),

  clearCart: () => set({ items: [] }),

  getTotal: () => (state: any) =>
    state.items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0),
}));
```

## 5. Upload Flow Integration

```typescript
// Complete Admin Workflow
import { ProductUploadForm } from '@/components/ProductUploadForm';
import { useMenuStore } from '@/store/menuStore';

export default function AdminPanel() {
  const { refetchProducts } = useMenuStore();

  const handleProductUploaded = async (formData: {
    productName: string;
    productDescription: string;
    productPrice: number;
    imageUrl: string;
  }) => {
    // After ProductUploadForm successful upload, data is saved to Supabase
    // You can now:
    
    // 1. Refetch products
    await refetchProducts();

    // 2. Show success notification
    toast.success('Product added successfully');

    // 3. Navigate or update UI
    navigate('/admin/products');
  };

  return (
    <ProductUploadForm onUploadSuccess={handleProductUploaded} />
  );
}
```

## 6. Error Handling

```typescript
// pages/Products.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const { products, isLoading, error, refetch } = useProducts();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button 
            onClick={refetch}
            className="ml-2 underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return <ProductGrid products={products} isLoading={isLoading} />;
}
```

## 7. Performance Optimization

### Lazy Loading Images

```typescript
// ProductGrid already uses lazy loading
<img src={url} alt={name} loading="lazy" />
```

### Pagination (if needed)

```typescript
// hooks/useProductsPaginated.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useProductsPaginated(pageSize = 12) {
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    Promise.all([
      supabase.from('products').select('*', { count: 'exact' }),
      supabase.from('products').select('*').range(from, to),
    ]).then(([countResult, dataResult]) => {
      if (countResult.count) setTotal(countResult.count);
      if (dataResult.data) setProducts(dataResult.data);
    });
  }, [page, pageSize]);

  return {
    products,
    page,
    setPage,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

## 8. Testing

```typescript
// Test ProductUploadForm
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductUploadForm } from '@/components/ProductUploadForm';

describe('ProductUploadForm', () => {
  it('uploads image and creates product', async () => {
    const onSuccess = vi.fn();
    render(<ProductUploadForm onUploadSuccess={onSuccess} />);

    // Find input and upload file
    const input = screen.getByRole('textbox', { name: /product name/i });
    fireEvent.change(input, { target: { value: 'Test Product' } });

    // Submit form
    const button = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(button);

    // Wait for callback
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
```

## 9. Environment Setup Checklist

- ✅ Supabase project created
- ✅ `products` table created with schema
- ✅ `products` storage bucket configured (public)
- ✅ RLS policies set up
- ✅ Development environment variables set (.env.local)
- ✅ Dependencies installed (`npm install browser-image-compression @supabase/supabase-js`)
- ✅ Components created (ProductGrid, ProductUploadForm)
- ✅ Hooks created (useProducts, useImageUpload, useImageCompression)

## 10. Next Steps

1. Run Supabase SQL setup from `SUPABASE_PRODUCTS_SETUP.md`
2. Test ProductUploadForm by visiting admin page
3. Verify images upload to Supabase Storage
4. Check products table has correct data
5. Display products using ProductGrid
6. Integrate with existing cart/order system
7. Add search and filtering
8. Set up analytics/tracking (optional)

## Support

For issues:
1. Check browser console for errors
2. Verify Supabase credentials in `.env.local`
3. Check Supabase logs in dashboard
4. Enable RLS policy debugging in SQL editor
5. Test with curl: `curl -H "Authorization: Bearer YOUR_TOKEN" https://your-project.supabase.co/storage/v1/object/public/products/...`
