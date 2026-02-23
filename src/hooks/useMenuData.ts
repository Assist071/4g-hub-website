import { useEffect } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { useOrderStore } from '@/store/orderStore';
import { supabase } from '@/lib/supabase';

export function useMenuData() {
  const { fetchMenuItems, fetchMenuCategories, menuItems, menuCategories, loading, error } = useMenuStore();
  const orders = useOrderStore(state => state.orders);

  useEffect(() => {
    const loadMenuData = async () => {
      await Promise.all([
        fetchMenuItems(),
        fetchMenuCategories()
      ]);
    };

    loadMenuData();
  }, [fetchMenuItems, fetchMenuCategories]);

  // Real-time subscription to menu items changes
  useEffect(() => {
    const subscription = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          // Reload menu items when quantity changes
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMenuItems]);

  return {
    menuItems,
    menuCategories,
    loading,
    error
  };
}
