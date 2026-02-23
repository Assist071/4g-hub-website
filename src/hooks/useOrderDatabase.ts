import { supabase } from '@/lib/supabase';
import { Order, OrderItem, MenuItem } from '@/types';

export function useOrderDatabase() {
  /**
   * Save a new order to the database
   */
  const saveOrder = async (order: Order) => {
    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: order.orderNumber,
            terminal: order.terminal,
            customer_name: order.customerName,
            total: order.total,
            status: order.status,
            created_at: order.createdAt,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = order.items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        customizations: item.customizations,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      console.log('Order saved successfully:', orderData.id);
      return { success: true, orderId: orderData.id };
    } catch (error) {
      console.error('Error saving order:', error);
      return { success: false, error };
    }
  };

  /**
   * Save order item to database (when adding to cart)
   */
  const saveOrderItem = async (
    tempOrderId: string,
    item: OrderItem,
    menuItem: MenuItem
  ) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: tempOrderId,
            menu_item_id: menuItem.id,
            menu_item_name: menuItem.name,
            price: menuItem.price,
            quantity: item.quantity,
            customizations: item.customizations,
            notes: item.notes,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('Order item saved:', data.id);
      return { success: true, itemId: data.id };
    } catch (error) {
      console.error('Error saving order item:', error);
      return { success: false, error };
    }
  };

  /**
   * Fetch all pending orders
   */
  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (*)
        `
        )
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, orders: data };
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return { success: false, error };
    }
  };

  /**
   * Fetch orders by status
   */
  const fetchOrdersByStatus = async (status: Order['status']) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (*)
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, orders: data };
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return { success: false, error };
    }
  };

  /**
   * Update order status in database
   */
  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    try {
      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completed_at = new Date();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      console.log(`Order ${orderId} updated to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error };
    }
  };

  /**
   * Delete order from database
   */
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);

      if (error) throw error;

      console.log('Order deleted:', orderId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, error };
    }
  };

  /**
   * Get next order number
   */
  const getNextOrderNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      const nextNumber = (data?.order_number || 0) + 1;
      return { success: true, nextNumber };
    } catch (error) {
      console.error('Error getting next order number:', error);
      return { success: true, nextNumber: 1 };
    }
  };

  /**
   * Subscribe to real-time orders updates
   */
  const subscribeToOrders = (callback: (orders: any) => void) => {
    const subscription = supabase
      .from('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  };

  return {
    saveOrder,
    saveOrderItem,
    fetchPendingOrders,
    fetchOrdersByStatus,
    updateOrderStatus,
    deleteOrder,
    getNextOrderNumber,
    subscribeToOrders,
  };
}
