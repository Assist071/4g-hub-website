import { create } from 'zustand';
import { Order, OrderItem, MenuItem, MenuCategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface OrderStore {
  orders: Order[];
  currentOrder: OrderItem[];
  orderNumber: number;
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  isAdminAuthenticated: boolean;
  tempOrderId?: string;
  loadingOrders: boolean;
  cartItemQuantityTracker: Record<string, { menuItemId: string; quantity: number }>;
  
  // Private helpers
  _reduceProductQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  _restoreProductQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  
  // Order Actions
  addToOrder: (item: MenuItem, quantity: number, customizations: string[], notes?: string, flavors?: string[]) => void;
  removeFromOrder: (itemId: string) => void;
  updateOrderItem: (itemId: string, quantity: number, customizations: string[], notes?: string, flavors?: string[]) => void;
  clearCurrentOrder: () => void;
  submitOrder: (customerName?: string, terminal?: string) => Promise<Order>;
  updateOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  completeOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => Promise<void>;
  loadOrdersFromDatabase: () => Promise<void>;
  loadMenuItemsFromDatabase: () => Promise<void>;
  
  // Menu Actions
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addMenuCategory: (category: Omit<MenuCategory, 'id'>) => void;
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => void;
  deleteMenuCategory: (id: string) => void;
  loadCategoriesFromDatabase: () => Promise<void>;
  
  // Admin Actions
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  
  // Getters
  getCurrentOrderTotal: () => number;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getPendingOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: [],
  orderNumber: 1,
  menuItems: [],
  menuCategories: [],
  isAdminAuthenticated: false,
  tempOrderId: undefined,
  loadingOrders: false,
  cartItemQuantityTracker: {},

  // Helper function to reduce product quantity in database
  _reduceProductQuantity: async (menuItemId: string, quantity: number) => {
    try {
      const { data: items, error: fetchError } = await supabase
        .from('menu_items')
        .select('quantity')
        .eq('id', menuItemId)
        .single();

      if (fetchError) {
        console.warn('Could not fetch item quantity:', fetchError);
        return;
      }

      const currentQuantity = items?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);

      await supabase
        .from('menu_items')
        .update({ quantity: newQuantity })
        .eq('id', menuItemId);

      console.log(`Reduced product ${menuItemId} quantity by ${quantity} (now: ${newQuantity})`);
    } catch (error) {
      console.error('Error reducing product quantity:', error);
    }
  },

  // Helper function to restore product quantity in database
  _restoreProductQuantity: async (menuItemId: string, quantity: number) => {
    try {
      const { data: items, error: fetchError } = await supabase
        .from('menu_items')
        .select('quantity')
        .eq('id', menuItemId)
        .single();

      if (fetchError) {
        console.warn('Could not fetch item quantity:', fetchError);
        return;
      }

      const currentQuantity = items?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      await supabase
        .from('menu_items')
        .update({ quantity: newQuantity })
        .eq('id', menuItemId);

      console.log(`Restored product ${menuItemId} quantity by ${quantity} (now: ${newQuantity})`);
    } catch (error) {
      console.error('Error restoring product quantity:', error);
    }
  },

  // Order Actions
  addToOrder: (item, quantity, customizations, notes, flavors) => {
    const newItem: OrderItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      menuItem: item,
      quantity,
      customizations,
      flavors,
      notes
    };
    
    set(state => ({
      currentOrder: [...state.currentOrder, newItem],
      cartItemQuantityTracker: {
        ...state.cartItemQuantityTracker,
        [newItem.id]: { menuItemId: item.id, quantity }
      }
    }));

    // Reduce product quantity in database
    get()._reduceProductQuantity(item.id, quantity);
    
    // Log item addition
    console.log('Item added to order:', { item: item.name, quantity });
  },

  removeFromOrder: (itemId) => {
    const state = get();
    const tracker = state.cartItemQuantityTracker[itemId];
    
    // Restore product quantity if it was tracked
    if (tracker) {
      get()._restoreProductQuantity(tracker.menuItemId, tracker.quantity);
    }

    set(state => {
      const newTracker = { ...state.cartItemQuantityTracker };
      delete newTracker[itemId];
      return {
        currentOrder: state.currentOrder.filter(item => item.id !== itemId),
        cartItemQuantityTracker: newTracker
      };
    });
  },

  updateOrderItem: (itemId, quantity, customizations, notes, flavors) => {
    const state = get();
    const currentItem = state.currentOrder.find(item => item.id === itemId);
    const tracker = state.cartItemQuantityTracker[itemId];

    if (currentItem && tracker) {
      const quantityDifference = quantity - currentItem.quantity;

      // If quantity increased, reduce more inventory
      if (quantityDifference > 0) {
        get()._reduceProductQuantity(tracker.menuItemId, quantityDifference);
        tracker.quantity = quantity;
      }
      // If quantity decreased, restore some inventory
      else if (quantityDifference < 0) {
        get()._restoreProductQuantity(tracker.menuItemId, Math.abs(quantityDifference));
        tracker.quantity = quantity;
      }
    }

    set(state => ({
      currentOrder: state.currentOrder.map(item => 
        item.id === itemId 
          ? { ...item, quantity, customizations, notes, flavors }
          : item
      ),
      cartItemQuantityTracker: {
        ...state.cartItemQuantityTracker,
        [itemId]: tracker
      }
    }));
  },

  clearCurrentOrder: () => {
    const state = get();
    
    // Restore all quantities
    Object.values(state.cartItemQuantityTracker).forEach((tracker) => {
      get()._restoreProductQuantity(tracker.menuItemId, tracker.quantity);
    });

    set({ 
      currentOrder: [],
      cartItemQuantityTracker: {}
    });
  },

  submitOrder: async (customerName, terminal = 'Terminal 1') => {
    const state = get();
    const total = state.getCurrentOrderTotal();
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: state.orderNumber,
      items: state.currentOrder,
      total,
      status: 'pending',
      customerName,
      createdAt: new Date(),
      terminal
    };

    // Save to database
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: newOrder.orderNumber,
            terminal: newOrder.terminal,
            customer_name: newOrder.customerName,
            total: newOrder.total,
            status: newOrder.status,
            created_at: newOrder.createdAt,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (orderData && newOrder.items.length > 0) {
        const orderItems = newOrder.items.map((item) => ({
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
      }

      console.log('Order saved to database:', orderData.id);
    } catch (error) {
      console.error('Error saving order to database:', error);
      // Continue with local state even if database save fails
    }

    set(state => ({
      orders: [...state.orders, newOrder],
      currentOrder: [],
      cartItemQuantityTracker: {},
      orderNumber: state.orderNumber + 1
    }));

    return newOrder;
  },

  updateOrder: (order) => {
    set(state => ({
      orders: state.orders.map(o => o.id === order.id ? order : o)
    }));
  },

  updateOrderStatus: async (orderId, status) => {
    set(state => ({
      orders: state.orders.map(order => 
        order.id === orderId 
          ? { ...order, status, ...(status === 'completed' && { completedAt: new Date() }) }
          : order
      )
    }));

    // Update in database
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
      console.log(`Order ${orderId} updated to ${status} in database`);
    } catch (error) {
      console.error('Error updating order status in database:', error);
    }
  },

  completeOrder: (orderId) => {
    get().updateOrderStatus(orderId, 'completed');
  },

  deleteOrder: async (orderId) => {
    set(state => ({
      orders: state.orders.filter(order => order.id !== orderId)
    }));

    // Delete from database
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      console.log('Order deleted from database:', orderId);
    } catch (error) {
      console.error('Error deleting order from database:', error);
    }
  },

  loadOrdersFromDatabase: async () => {
    set({ loadingOrders: true });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database orders to match Order type
      if (data) {
        const convertedOrders: Order[] = data.map((dbOrder: any) => {
          // Convert order_items to OrderItem format
          const items: OrderItem[] = (dbOrder.order_items || []).map((item: any) => ({
            id: item.id,
            name: item.menu_item_name,
            menuItem: {
              id: item.menu_item_id,
              name: item.menu_item_name,
              description: '',
              price: parseFloat(item.price),
              category: '',
              available: true,
            } as MenuItem,
            quantity: item.quantity,
            customizations: item.customizations || [],
            notes: item.notes,
          }));

          return {
            id: dbOrder.id,
            orderNumber: dbOrder.order_number,
            items,
            total: parseFloat(dbOrder.total),
            status: dbOrder.status,
            customerName: dbOrder.customer_name,
            createdAt: new Date(dbOrder.created_at),
            completedAt: dbOrder.completed_at ? new Date(dbOrder.completed_at) : undefined,
            terminal: dbOrder.terminal,
          } as Order;
        });

        set({ 
          orders: convertedOrders,
          loadingOrders: false
        });
        console.log('Loaded', convertedOrders.length, 'orders from database');
      }
    } catch (error) {
      console.error('Error loading orders from database:', error);
      set({ loadingOrders: false });
    }
  },

  loadMenuItemsFromDatabase: async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const convertedItems: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: parseFloat(item.price),
          category: item.category || '',
          image: item.image,
          available: item.available ?? true,
          customization: item.customization ? JSON.parse(item.customization) : [],
          quantity: item.quantity || 0,
        }));

        set({ menuItems: convertedItems });
        console.log('Loaded', convertedItems.length, 'menu items from database with updated quantities');
      }
    } catch (error) {
      console.error('Error loading menu items from database:', error);
    }
  },

  loadCategoriesFromDatabase: async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const convertedCategories: MenuCategory[] = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          icon: cat.icon || '🍽️',
        }));

        set({ menuCategories: convertedCategories });
        console.log('Loaded', convertedCategories.length, 'menu categories from database');
      }
    } catch (error) {
      console.error('Error loading menu categories from database:', error);
    }
  },

  // Menu Actions
  addMenuItem: (item) => {
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`
    };
    
    set(state => ({
      menuItems: [...state.menuItems, newItem]
    }));
  },

  updateMenuItem: (id, updates) => {
    set(state => ({
      menuItems: state.menuItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },

  deleteMenuItem: (id) => {
    set(state => ({
      menuItems: state.menuItems.filter(item => item.id !== id)
    }));
  },

  addMenuCategory: (category) => {
    const newCategory: MenuCategory = {
      ...category,
      id: `cat-${Date.now()}`
    };
    
    set(state => ({
      menuCategories: [...state.menuCategories, newCategory]
    }));
  },

  updateMenuCategory: (id, updates) => {
    set(state => ({
      menuCategories: state.menuCategories.map(category => 
        category.id === id ? { ...category, ...updates } : category
      )
    }));
  },

  deleteMenuCategory: (id) => {
    set(state => ({
      menuCategories: state.menuCategories.filter(category => category.id !== id)
    }));
  },

  // Getters
  getCurrentOrderTotal: () => {
    const { currentOrder } = get();
    return currentOrder.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status);
  },

  getPendingOrders: () => {
    return get().orders.filter(order => order.status !== 'completed');
  },

  // Admin Actions
  adminLogin: (password) => {
    const adminPassword = 'admin'; // Simple password for local system
    if (password === adminPassword) {
      set({ isAdminAuthenticated: true });
      return true;
    }
    return false;
  },

  adminLogout: () => {
    set({ isAdminAuthenticated: false });
  }
}));