# Integration Examples

## How to Add Menu Management to Your Admin Page

### Example 1: Simple Integration
```tsx
import { AdminMenuManagement } from '@/components/AdminMenuManagement';
import { useOrderStore } from '@/store/orderStore';

export default function AdminPage() {
  const { isAdminAuthenticated } = useOrderStore();
  
  if (!isAdminAuthenticated) {
    return <div>Access Denied - Admin Login Required</div>;
  }
  
  return <AdminMenuManagement />;
}
```

### Example 2: With Tab Navigation
```tsx
import { useState } from 'react';
import { AdminMenuManagement } from '@/components/AdminMenuManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrderStore } from '@/store/orderStore';

export default function AdminPage() {
  const { isAdminAuthenticated } = useOrderStore();
  const [activeTab, setActiveTab] = useState('menu');
  
  if (!isAdminAuthenticated) {
    return <div>Access Denied</div>;
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="menu">Menu Management</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
      </TabsList>
      
      <TabsContent value="menu">
        <AdminMenuManagement />
      </TabsContent>
      
      <TabsContent value="orders">
        {/* Other components */}
      </TabsContent>
      
      <TabsContent value="inventory">
        {/* Other components */}
      </TabsContent>
    </Tabs>
  );
}
```

### Example 3: Using Menu Data in Your Components
```tsx
import { useMenuData } from '@/hooks/useMenuData';
import { useMenuStore } from '@/store/menuStore';
import { Button } from '@/components/ui/button';

export function CustomMenuDisplay() {
  const { menuItems, menuCategories, loading, error } = useMenuData();
  const { deleteMenuItem } = useMenuStore();
  
  if (loading) return <div>Loading menu...</div>;
  if (error) return <div>Error loading menu: {error}</div>;
  
  return (
    <div>
      <h2>Current Menu</h2>
      <div className="grid gap-4">
        {menuItems.map(item => (
          <div key={item.id} className="p-4 border rounded">
            <h3>{item.name}</h3>
            <p>₱{item.price.toFixed(2)}</p>
            <p>{item.description}</p>
            <Button 
              variant="destructive"
              onClick={() => deleteMenuItem(item.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Adding Items Programmatically
```tsx
import { useMenuStore } from '@/store/menuStore';

export function QuickAddMenu() {
  const { addMenuItem, menuCategories, error } = useMenuStore();
  
  const handleAddPopularItem = async () => {
    const result = await addMenuItem({
      name: 'Adobo',
      description: 'Filipino chicken adobo',
      price: 45.00,
      category: menuCategories[0]?.id || '',
      available: true,
    });
    
    if (result) {
      alert('Item added successfully!');
    } else {
      alert('Error: ' + error);
    }
  };
  
  return (
    <button onClick={handleAddPopularItem}>
      Add Adobo
    </button>
  );
}
```

### Example 5: Using Menu Data with Filters
```tsx
import { useMenuData } from '@/hooks/useMenuData';
import { useState } from 'react';

export function FilteredMenu() {
  const { menuItems, menuCategories } = useMenuData();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const filtered = selectedCategory 
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;
  
  return (
    <div>
      <div className="mb-4">
        <label>Filter by Category:</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All</option>
          {menuCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid gap-4">
        {filtered.map(item => (
          <div key={item.id} className="p-4 border rounded">
            <h3>{item.name}</h3>
            <p>₱{item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Working with Menu Store Directly

### Fetch Menu Items
```tsx
import { useMenuStore } from '@/store/menuStore';
import { useEffect } from 'react';

export function MyComponent() {
  const { menuItems, fetchMenuItems, loading, error } = useMenuStore();
  
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {menuItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Add a Menu Item
```tsx
import { useMenuStore } from '@/store/menuStore';

export function AddItemForm() {
  const { addMenuItem, error } = useMenuStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addMenuItem({
      name: 'New Item',
      description: 'Description',
      price: 50.00,
      category: 'category-id',
      available: true,
    });
    
    if (result) {
      console.log('Item added:', result);
    } else {
      console.log('Error:', error);
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Update a Menu Item
```tsx
import { useMenuStore } from '@/store/menuStore';

export function UpdateItemForm({ itemId }: { itemId: string }) {
  const { updateMenuItem, error } = useMenuStore();
  
  const handleUpdate = async () => {
    const result = await updateMenuItem(itemId, {
      price: 55.00,
      available: true,
    });
    
    if (result) {
      console.log('Item updated:', result);
    } else {
      console.log('Error:', error);
    }
  };
  
  return <button onClick={handleUpdate}>Update Price</button>;
}
```

### Delete a Menu Item
```tsx
import { useMenuStore } from '@/store/menuStore';

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const { deleteMenuItem, error } = useMenuStore();
  
  const handleDelete = async () => {
    const success = await deleteMenuItem(itemId);
    
    if (success) {
      console.log('Item deleted');
    } else {
      console.log('Error:', error);
    }
  };
  
  return (
    <button onClick={handleDelete} className="btn-danger">
      Delete Item
    </button>
  );
}
```

## Displaying Menu with Real-time Updates

```tsx
import { useMenuData } from '@/hooks/useMenuData';
import { useEffect, useState } from 'react';

export function MenuBoard() {
  const { menuItems, menuCategories, loading } = useMenuData();
  const [refresh, setRefresh] = useState(0);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setRefresh(r => r + 1), 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <div>Loading menu...</div>;
  
  return (
    <div>
      <h1>Menu Board</h1>
      {menuCategories.map(category => (
        <div key={category.id} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {category.icon} {category.name}
          </h2>
          <div className="grid gap-4">
            {menuItems
              .filter(item => item.category === category.id && item.available)
              .map(item => (
                <div key={item.id} className="p-4 border rounded">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p>{item.description}</p>
                  <p className="font-bold text-lg">₱{item.price.toFixed(2)}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling Best Practices

```tsx
import { useMenuStore } from '@/store/menuStore';

export function SafeMenuComponent() {
  const { menuItems, error, addMenuItem } = useMenuStore();
  
  const handleAdd = async () => {
    try {
      const result = await addMenuItem({
        name: 'Test',
        description: 'Test item',
        price: 50,
        category: 'cat-1',
        available: true,
      });
      
      if (!result) {
        console.error('Failed to add item');
        // Show error to user
      } else {
        console.log('Success!');
        // Show success message
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      // Show error toast
    }
  };
  
  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}
      <button onClick={handleAdd}>Add Item</button>
    </div>
  );
}
```

## Complete Admin Dashboard Example

```tsx
import { useState } from 'react';
import { AdminMenuManagement } from '@/components/AdminMenuManagement';
import { useOrderStore } from '@/store/orderStore';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  const { isAdminAuthenticated } = useOrderStore();
  const [activeSection, setActiveSection] = useState('menu');
  
  if (!isAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p>Please log in as admin to access this page</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex gap-4">
          <button 
            onClick={() => setActiveSection('menu')}
            className={activeSection === 'menu' ? 'font-bold' : ''}
          >
            Menu Management
          </button>
          <button 
            onClick={() => setActiveSection('orders')}
            className={activeSection === 'orders' ? 'font-bold' : ''}
          >
            Orders
          </button>
        </div>
      </nav>
      
      <main className="container mx-auto">
        {activeSection === 'menu' && <AdminMenuManagement />}
        {activeSection === 'orders' && <div>Orders Section</div>}
      </main>
    </div>
  );
}
```

## Key Takeaways

1. **Use `useMenuData`** for automatic fetching in regular components
2. **Use `useMenuStore`** when you need direct control or manual operations
3. **Always handle loading and error states**
4. **Check authentication before showing admin components**
5. **The store automatically updates when data changes**
