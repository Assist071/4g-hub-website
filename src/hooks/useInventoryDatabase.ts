import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types';

export function useInventoryDatabase() {
  /**
   * Reduce product quantity when added to cart
   */
  const reduceQuantity = async (menuItemId: string, quantity: number) => {
    try {
      // Get current quantity
      const { data: items, error: fetchError } = await supabase
        .from('menu_items')
        .select('quantity')
        .eq('id', menuItemId)
        .single();

      if (fetchError) {
        console.warn('Could not fetch item quantity - table may not exist:', fetchError);
        return { success: true }; // Don't fail, just warn
      }

      const currentQuantity = items?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);

      // Update quantity
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ quantity: newQuantity })
        .eq('id', menuItemId);

      if (updateError) {
        console.warn('Could not update quantity:', updateError);
        return { success: true }; // Don't fail, just warn
      }

      console.log(`Reduced ${menuItemId} quantity by ${quantity} (now: ${newQuantity})`);
      return { success: true };
    } catch (error) {
      console.error('Error reducing quantity:', error);
      return { success: true }; // Don't fail, just warn
    }
  };

  /**
   * Restore product quantity when removed from cart
   */
  const restoreQuantity = async (menuItemId: string, quantity: number) => {
    try {
      const { data: items, error: fetchError } = await supabase
        .from('menu_items')
        .select('quantity')
        .eq('id', menuItemId)
        .single();

      if (fetchError) {
        console.warn('Could not fetch item quantity:', fetchError);
        return { success: true };
      }

      const currentQuantity = items?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ quantity: newQuantity })
        .eq('id', menuItemId);

      if (updateError) {
        console.warn('Could not restore quantity:', updateError);
        return { success: true };
      }

      console.log(`Restored ${menuItemId} quantity by ${quantity} (now: ${newQuantity})`);
      return { success: true };
    } catch (error) {
      console.error('Error restoring quantity:', error);
      return { success: true };
    }
  };

  /**
   * Get current quantity of a product
   */
  const getQuantity = async (menuItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('quantity')
        .eq('id', menuItemId)
        .single();

      if (error) {
        console.warn('Could not fetch quantity:', error);
        return -1; // Return -1 to indicate unlimited/unknown
      }

      return data?.quantity || 0;
    } catch (error) {
      console.error('Error getting quantity:', error);
      return -1;
    }
  };

  /**
   * Check if product has enough stock
   */
  const hasStock = async (menuItemId: string, requiredQuantity: number) => {
    const currentQuantity = await getQuantity(menuItemId);
    if (currentQuantity === -1) return true; // Unknown/unlimited
    return currentQuantity >= requiredQuantity;
  };

  /**
   * Bulk reduce quantities when order is submitted
   */
  const reduceQuantitiesForOrder = async (items: Array<{ id: string; quantity: number }>) => {
    try {
      for (const item of items) {
        await reduceQuantity(item.id, item.quantity);
      }
      return { success: true };
    } catch (error) {
      console.error('Error reducing quantities for order:', error);
      return { success: true };
    }
  };

  return {
    reduceQuantity,
    restoreQuantity,
    getQuantity,
    hasStock,
    reduceQuantitiesForOrder,
  };
}
