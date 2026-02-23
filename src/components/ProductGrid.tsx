import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageIcon, ShoppingCart } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt?: string;
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product) => void;
}

/**
 * Product Grid Display Component
 * 
 * Features:
 * - Responsive grid layout
 * - Square images (1:1 ratio) with object-cover
 * - Lazy loading support
 * - Product details display
 * - Add to cart functionality
 * - Mobile-friendly
 */
export function ProductGrid({
  products,
  isLoading = false,
  onAddToCart,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
        >
          {/* Image Container - Always Square (1:1 ratio) */}
          <div className="relative w-full h-40 overflow-hidden bg-gray-100 group">
            {product.imageUrl ? (
              <>
                <img
                  src={`${product.imageUrl}?t=${product.createdAt ? new Date(product.createdAt).getTime() : Date.now()}`}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">No image</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <CardContent className="pt-4 pb-3 space-y-2 flex-1 flex flex-col">
            {/* Name */}
            <h3 className="font-semibold text-sm line-clamp-2">
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Price and Badge */}
            <div className="flex items-center justify-between pt-2 mt-auto">
              <span className="text-lg font-bold text-emerald-600">
                ₱{product.price.toFixed(2)}
              </span>
              <Badge variant="outline" className="text-xs">
                Available
              </Badge>
            </div>
          </CardContent>

          {/* Add to Cart Button */}
          {onAddToCart && (
            <div className="px-4 pb-4 border-t">
              <Button
                onClick={() => onAddToCart(product)}
                variant="default"
                size="sm"
                className="w-full gap-2 text-xs"
              >
                <ShoppingCart className="w-3 h-3" />
                Add to Cart
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
