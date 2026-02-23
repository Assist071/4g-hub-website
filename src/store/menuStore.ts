import { create } from 'zustand';
import { MenuItem, MenuCategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface MenuStore {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  loading: boolean;
  error: string | null;
  
  // Fetch Actions
  fetchMenuItems: () => Promise<void>;
  fetchMenuCategories: () => Promise<void>;
  
  // Real-time Actions
  updateMenuItemFromRealtime: (item: MenuItem) => void;
  
  // Menu Item Actions
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile?: File) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, item: Partial<MenuItem>, imageFile?: File) => Promise<MenuItem | null>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  uploadMenuItemImage: (file: File) => Promise<string | null>;
  
  // Menu Category Actions
  addMenuCategory: (category: Omit<MenuCategory, 'id'>) => Promise<MenuCategory | null>;
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => Promise<MenuCategory | null>;
  deleteMenuCategory: (id: string) => Promise<boolean>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuItems: [],
  menuCategories: [],
  loading: false,
  error: null,

  // Fetch Menu Items
  fetchMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      set({ 
        menuItems: data || [],
        loading: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu items';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching menu items:', err);
    }
  },

  // Fetch Menu Categories
  fetchMenuCategories: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      set({ 
        menuCategories: data || [],
        loading: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu categories';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching categories:', err);
    }
  },

  // Update Menu Item from Real-time (no fetch)
  updateMenuItemFromRealtime: (item) => {
    set(state => ({
      menuItems: state.menuItems.map(existingItem =>
        existingItem.id === item.id ? item : existingItem
      )
    }));
  },

  // Add Menu Item
  addMenuItem: async (item, imageFile) => {
    try {
      let imageUrl = item.image;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await get().uploadMenuItemImage(imageFile);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...item, image: imageUrl }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        menuItems: [...state.menuItems, data]
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add menu item';
      set({ error: errorMessage });
      console.error('Error adding menu item:', err);
      return null;
    }
  },

  // Update Menu Item
  updateMenuItem: async (id, updates, imageFile) => {
    try {
      let updateData = updates;

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await get().uploadMenuItemImage(imageFile);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
        updateData = { ...updates, image: imageUrl };
      }

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        menuItems: state.menuItems.map(item => 
          item.id === id ? data : item
        )
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu item';
      set({ error: errorMessage });
      console.error('Error updating menu item:', err);
      return null;
    }
  },

  // Upload Menu Item Image
  uploadMenuItemImage: async (file) => {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const filename = `menu-item-${timestamp}-${random}.jpg`;
      const filePath = `menu-items/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '0',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      set({ error: errorMessage });
      console.error('Error uploading image:', err);
      return null;
    }
  },

  // Delete Menu Item
  deleteMenuItem: async (id) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        menuItems: state.menuItems.filter(item => item.id !== id)
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete menu item';
      set({ error: errorMessage });
      console.error('Error deleting menu item:', err);
      return false;
    }
  },

  // Add Menu Category
  addMenuCategory: async (category) => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        menuCategories: [...state.menuCategories, data]
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add menu category';
      set({ error: errorMessage });
      console.error('Error adding category:', err);
      return null;
    }
  },

  // Update Menu Category
  updateMenuCategory: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        menuCategories: state.menuCategories.map(cat => 
          cat.id === id ? data : cat
        )
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu category';
      set({ error: errorMessage });
      console.error('Error updating category:', err);
      return null;
    }
  },

  // Delete Menu Category
  deleteMenuCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        menuCategories: state.menuCategories.filter(cat => cat.id !== id)
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete menu category';
      set({ error: errorMessage });
      console.error('Error deleting category:', err);
      return false;
    }
  }
}));
