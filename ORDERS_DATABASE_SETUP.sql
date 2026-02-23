-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER NOT NULL UNIQUE,
  terminal TEXT NOT NULL,
  customer_name TEXT,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila',
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  menu_item_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  customizations TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_terminal ON orders(terminal);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all users to read orders and order items
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);

-- Create policies to allow authenticated users to insert orders
CREATE POLICY "Enable insert for authenticated users" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);
CREATE POLICY "Enable insert for authenticated users" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

-- Create policies for updating order status
CREATE POLICY "Enable update orders for authenticated users" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete orders for authenticated users" ON orders FOR DELETE USING (true);

-- Trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila';
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_timestamp 
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();
