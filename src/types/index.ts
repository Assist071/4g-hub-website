export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  customization?: (string | { name: string; price: number })[];
  flavors?: string[];
  quantity?: number;
}

export interface OrderItem {
  name: any;
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: string[];
  flavors?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  customerName?: string;
  createdAt: Date;
  completedAt?: Date;
  terminal: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Feedback {
  id: string;
  customerName: string;
  email?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  status: 'new' | 'reviewed' | 'archived';
}

export interface StaffUser {
  id: string;
  email: string;
  role: 'staff' | 'manager' | 'chef' | 'cashier' | 'admin';
  password: string;
  createdAt: Date;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';