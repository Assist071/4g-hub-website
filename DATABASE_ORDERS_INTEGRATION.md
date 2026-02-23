# Database Integration Setup Guide - Orders System

This guide explains how to set up the database integration for orders when customers add items to cart.

## What's New

The order system now automatically saves orders to your Supabase database when customers add items and submit orders. This replaces the local-only storage with persistent database records.

## Database Schema

Two new tables have been created in the database:

### `orders` Table
Stores the main order information:
- `id` (UUID) - Primary key
- `order_number` (Integer) - Sequential order number
- `terminal` (Text) - Which terminal/PC the order came from
- `customer_name` (Text) - Optional customer name
- `total` (Decimal) - Order total amount
- `status` (Text) - Order status: pending, preparing, ready, completed
- `created_at` (Timestamp) - When the order was placed
- `completed_at` (Timestamp) - When the order was completed
- `updated_at` (Timestamp) - Last update time

### `order_items` Table
Stores individual items in each order:
- `id` (UUID) - Primary key
- `order_id` (UUID) - Foreign key to orders table
- `menu_item_id` (Text) - Reference to menu item
- `menu_item_name` (Text) - Name of the item
- `price` (Decimal) - Price at time of order
- `quantity` (Integer) - Quantity ordered
- `customizations` (Text Array) - Any customizations
- `notes` (Text) - Special instructions
- `created_at` (Timestamp) - When item was added

## Setup Instructions

### Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the SQL from `ORDERS_DATABASE_SETUP.sql` file in your project root
5. Paste it into the SQL editor
6. Click **Run** to create the tables

Alternatively, you can run each SQL statement individually if you encounter any issues.

### Step 2: Verify Table Creation

1. In Supabase, click on **Table Editor**
2. You should see two new tables:
   - `orders`
   - `order_items`
3. Click on each table to verify the columns are correct

### Step 3: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the Menu page
3. Add some items to cart
4. Fill in the PC number and click "Submit Order"
5. You should see a success message
6. Go to your Supabase dashboard → Table Editor → `orders` table
7. You should see your new order with the items in `order_items` table

## Code Changes

### Updated Files

#### `src/store/orderStore.ts`
- Added database integration to `addToOrder()` - logs when items are added
- Added `submitOrder()` - now saves orders to database with all items
- Updated `updateOrderStatus()` - syncs status changes to database
- Updated `deleteOrder()` - removes orders from database

#### `src/components/OrderCart.tsx`
- Modified `handleSubmitOrder()` to be async and properly wait for database save

#### New Files

##### `src/hooks/useOrderDatabase.ts`
New hook providing database operations:
- `saveOrder()` - Save complete order to database
- `saveOrderItem()` - Save individual item to database
- `fetchPendingOrders()` - Get pending orders
- `fetchOrdersByStatus()` - Get orders by status
- `updateOrderStatus()` - Update order status
- `deleteOrder()` - Delete order
- `getNextOrderNumber()` - Get next available order number
- `subscribeToOrders()` - Real-time updates (optional)

## Feature Capabilities

### Automatic Order Saving
When a customer submits an order:
1. Order is created with all items and pricing
2. Order is immediately saved to the database
3. Each order item is saved with customizations and notes
4. Order gets a unique ID and sequential order number

### Order Status Tracking
- Admins can update order status: pending → preparing → ready → completed
- Status changes are synced to database in real-time
- Order completion timestamp is recorded

### Order History
All orders are persisted in the database, allowing you to:
- View historical orders
- Generate reports
- Track sales trends
- Audit order details

## Real-Time Updates (Optional Enhancement)

The `useOrderDatabase` hook includes `subscribeToOrders()` for real-time updates. To implement this in your kitchen dashboard:

```typescript
import { useOrderDatabase } from '@/hooks/useOrderDatabase';

export function KitchenDashboard() {
  const { subscribeToOrders } = useOrderDatabase();

  useEffect(() => {
    const subscription = subscribeToOrders((payload) => {
      console.log('Order update:', payload);
      // Update your UI with latest orders
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

## Security Considerations

The current setup uses RLS (Row Level Security) with permissive policies to allow all users to read/write orders. For production, you should:

1. Restrict write access to authenticated users only
2. Add admin authentication verification
3. Log all order operations for audit trails
4. Implement proper authorization checks

To add stricter security, modify the RLS policies in Supabase.

## Troubleshooting

### "Missing Supabase environment variables" Error
- Ensure `.env.local` file exists with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Restart the development server

### Orders Not Being Saved
1. Check browser console for errors
2. Verify tables exist in Supabase
3. Check .env.local credentials are correct
4. Verify RLS policies are enabled

### Order Appears Locally But Not in Database
- Database save happens asynchronously
- Check the browser console for error messages
- Verify your Supabase connection and API keys

### Performance Issues
- Ensure indexes are created (they are in the SQL)
- Consider adding pagination for historical orders
- Monitor database query performance

## Future Enhancements

Potential improvements to implement:

1. **Order Notifications**: Real-time alerts when new orders arrive
2. **Order History Page**: View and filter past orders
3. **Invoice Generation**: Generate PDFs for orders
4. **Kitchen Display System**: Real-time order display on kitchen screens
5. **Customer Analytics**: Track popular items and sales trends
6. **Order Modifications**: Allow updating orders before completion
7. **Payment Integration**: Track payment status and methods

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Supabase tables are properly created
3. Ensure environment variables are set correctly
4. Review logs in Supabase dashboard under "Database" → "Logs"
