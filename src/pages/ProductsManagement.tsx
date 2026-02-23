import { useState } from 'react';
import { ProductUploadForm } from '@/components/ProductUploadForm';
import { ProductGrid } from '@/components/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Product } from '@/components/ProductGrid';

export default function ProductsManagement() {
  const { products, isLoading, error, refetch } = useProducts();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUploadSuccess = async () => {
    setIsUploadDialogOpen(false);
    // Refresh products list after successful upload
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // TODO: Implement cart logic
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Products Management
          </h1>
          <p className="text-gray-600">
            Manage products, upload images, and organize your catalog
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductUploadForm onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Total Products: <strong className="text-gray-900">{products.length}</strong>
            </p>
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              Direct Link
            </p>
            <code className="text-xs text-blue-700 break-all">
              /products
            </code>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">
              Upload Button
            </p>
            <p className="text-xs text-green-700">Click "Add Product" to upload</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm font-semibold text-purple-900 mb-1">
              Auto Refresh
            </p>
            <p className="text-xs text-purple-700">Refreshes after upload</p>
          </div>
        </div>
      </div>
    </div>
  );
}
