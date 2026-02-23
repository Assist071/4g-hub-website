// Example: How to use the database integration in your components

// ============================================================================
// Example 1: Kitchen Dashboard - Display Pending Orders with Real-time Updates
// ============================================================================

import { useEffect, useState } from 'react';
import { useOrderDatabase } from '@/hooks/useOrderDatabase';

export function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchPendingOrders } = useOrderDatabase();

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    const result = await fetchPendingOrders();
    if (result.success) {
      setOrders(result.orders);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4">
          <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
          <p className="text-sm text-gray-600">{order.terminal}</p>
          <div className="mt-2 space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="text-sm">
                <span>{item.quantity}x {item.menu_item_name}</span>
                {item.customizations?.length > 0 && (
                  <div className="text-xs text-gray-500 ml-2">
                    {item.customizations.join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs text-brown ml-2">📝 {item.notes}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <span className="inline-block px-2 py-1 rounded text-white text-center" 
              style={{
                backgroundColor: order.status === 'pending' ? '#FFA500' : 
                                order.status === 'preparing' ? '#0066FF' :
                                order.status === 'ready' ? '#00CC00' : '#666'
              }}>
              {order.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 2: Order History Page - Filter and View All Orders
// ============================================================================

import { useEffect, useState } from 'react';
import { useOrderDatabase } from '@/hooks/useOrderDatabase';

export function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const { fetchOrdersByStatus } = useOrderDatabase();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (filter === 'all') {
      // Fetch all statuses
      const statuses = ['pending', 'preparing', 'ready', 'completed'];
      const allOrders = [];
      for (const status of statuses) {
        const result = await fetchOrdersByStatus(status);
        if (result.success) {
          allOrders.push(...result.orders);
        }
      }
      setOrders(allOrders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
    } else {
      const result = await fetchOrdersByStatus(filter);
      if (result.success) {
        setOrders(result.orders);
      }
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {['all', 'pending', 'preparing', 'ready', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => { setFilter(status); loadOrders(); }}
            className={`px-4 py-2 rounded ${
              filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border">
            <th className="border p-2">Order #</th>
            <th className="border p-2">Terminal</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Created</th>
            <th className="border p-2">Items</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border">
              <td className="border p-2">{order.order_number}</td>
              <td className="border p-2">{order.terminal}</td>
              <td className="border p-2">₱{order.total.toFixed(2)}</td>
              <td className="border p-2">
                <span className="px-2 py-1 rounded text-white text-sm"
                  style={{
                    backgroundColor: order.status === 'pending' ? '#FFA500' : 
                                    order.status === 'preparing' ? '#0066FF' :
                                    order.status === 'ready' ? '#00CC00' : '#666'
                  }}>
                  {order.status}
                </span>
              </td>
              <td className="border p-2">
                {new Date(order.created_at).toLocaleString()}
              </td>
              <td className="border p-2">
                {order.order_items?.length} items
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Example 3: Update Order Status - Admin Panel
// ============================================================================

import { useOrderDatabase } from '@/hooks/useOrderDatabase';
import { useOrderStore } from '@/store/orderStore';

export function UpdateOrderStatus({ orderId, currentStatus }) {
  const { updateOrderStatus } = useOrderDatabase();
  const { updateOrderStatus: updateLocal } = useOrderStore();

  const handleStatusChange = async (newStatus) => {
    // Update in Supabase
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      // Also update in local store
      updateLocal(orderId, newStatus);
      alert(`Order updated to ${newStatus}`);
    } else {
      alert('Error updating order status');
    }
  };

  const statuses = ['pending', 'preparing', 'ready', 'completed'];
  const currentIndex = statuses.indexOf(currentStatus);
  const nextStatus = statuses[currentIndex + 1];

  return (
    <div className="flex gap-2">
      {statuses.map(status => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          disabled={statuses.indexOf(status) < currentIndex}
          className={`px-3 py-2 rounded text-sm ${
            status === currentStatus ? 'bg-blue-500 text-white' :
            statuses.indexOf(status) < currentIndex ? 'bg-gray-200 cursor-not-allowed' :
            'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Example 4: Real-time Order Notifications (Advanced)
// ============================================================================

import { useEffect } from 'react';
import { useOrderDatabase } from '@/hooks/useOrderDatabase';

export function OrderNotifications() {
  const { subscribeToOrders } = useOrderDatabase();

  useEffect(() => {
    const subscription = subscribeToOrders((payload) => {
      console.log('Order event:', payload.eventType, payload.new);
      
      if (payload.eventType === 'INSERT') {
        // New order received
        const newOrder = payload.new;
        playNotificationSound();
        showNotification(`New Order #${newOrder.order_number}`);
      } else if (payload.eventType === 'UPDATE') {
        // Order updated
        const order = payload.new;
        if (order.status === 'ready') {
          showNotification(`Order #${order.order_number} is ready!`);
        }
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const playNotificationSound = () => {
    // Simple beep sound
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);
    
    osc.frequency.value = 800;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.5);
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('HubFoodFlow', { body: message });
    }
  };

  return null; // This component just handles notifications
}

// ============================================================================
// Example 5: Dashboard Statistics
// ============================================================================

import { useEffect, useState } from 'react';
import { useOrderDatabase } from '@/hooks/useOrderDatabase';

export function OrderStatistics() {
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0
  });

  const { fetchOrdersByStatus } = useOrderDatabase();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statuses = ['pending', 'preparing', 'ready', 'completed'];
    const newStats = {};
    
    for (const status of statuses) {
      const result = await fetchOrdersByStatus(status);
      newStats[status] = result.success ? result.orders.length : 0;
    }
    
    setStats(newStats);
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-orange-100 rounded">
        <p className="text-sm text-gray-600">Pending</p>
        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
      </div>
      <div className="p-4 bg-blue-100 rounded">
        <p className="text-sm text-gray-600">Preparing</p>
        <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
      </div>
      <div className="p-4 bg-green-100 rounded">
        <p className="text-sm text-gray-600">Ready</p>
        <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
      </div>
      <div className="p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">Completed</p>
        <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
      </div>
    </div>
  );
}
