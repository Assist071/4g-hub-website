import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt?: string;
}

/**
 * Hook to fetch products from Supabase
 * 
 * Features:
 * - Fetches from 'products' table
 * - Automatic error handling
 * - Loading state management
 * - Optional sorting/filtering
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      if (data) {
        // Transform database records to Product interface
        const transformedProducts: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.image_url,
          createdAt: item.created_at,
        }));
        setProducts(transformedProducts);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('Error fetching products:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProducts();
  };

  return {
    products,
    isLoading,
    error,
    refetch,
  };
}
