import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface ProductUploadFormProps {
  onUploadSuccess?: (productData: {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  }) => void;
  isSubmitting?: boolean;
}

/**
 * Product Upload Form Component
 * 
 * Features:
 * - Image upload with preview (1:1 square ratio)
 * - Automatic image compression (browser-image-compression)
 * - Upload to Supabase Storage
 * - Product details form
 * - Error handling
 * - Loading states
 */
export function ProductUploadForm({
  onUploadSuccess,
  isSubmitting = false,
}: ProductUploadFormProps) {
  // Form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Hooks
  const { isCompressing, error: compressionError, compressImage } = useImageCompression();
  const { isUploading, error: uploadError, uploadImage } = useImageUpload();

  const error = compressionError || uploadError;

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
      });

      if (compressedFile) {
        setSelectedFile(compressedFile);
        const preview = URL.createObjectURL(compressedFile);
        setImagePreview(preview);
      }
    } catch (err) {
      console.error('Image processing error:', err);
    }
  };

  // Handle image upload
  const handleUploadImage = async () => {
    if (!selectedFile) return;

    const url = await uploadImage(selectedFile, 'products');
    if (url) {
      setImageUrl(url);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !productPrice || !imageUrl) {
      alert('Please fill in all fields and upload an image');
      return;
    }

    onUploadSuccess?.({
      name: productName,
      description: productDescription,
      price: parseFloat(productPrice),
      imageUrl: imageUrl,
    });

    // Reset form
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setImagePreview(null);
    setSelectedFile(null);
    setImageUrl(null);
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setImageUrl(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Product Details</h3>

        {/* Product Name */}
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Fried Chicken"
            required
            className="mt-2"
          />
        </div>

        {/* Product Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="Describe your product"
            className="mt-2"
            rows={3}
          />
        </div>

        {/* Product Price */}
        <div>
          <Label htmlFor="price">Price (₱) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="0.00"
            required
            className="mt-2"
          />
        </div>
      </Card>

      {/* Image Upload Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Product Image *</h3>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {imageUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2 items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">Image uploaded successfully!</p>
          </div>
        )}

        {/* Image Preview or Upload Area */}
        <div className="mt-2">
          {imagePreview && !imageUrl ? (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover object-center"
              />

              {/* File Info Overlay */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)}KB` : 'Preview'}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
              <img
                src={imageUrl}
                alt="Uploaded"
                className="w-full h-full object-cover object-center"
              />

              {/* Change Button */}
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isCompressing || isUploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {isCompressing ? 'Processing...' : 'Click to upload image'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WebP (Max 10MB)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Upload Button - Show while image selected but not uploaded */}
        {selectedFile && !imageUrl && (
          <Button
            type="button"
            onClick={handleUploadImage}
            disabled={isUploading || isCompressing}
            variant="secondary"
            className="w-full gap-2"
          >
            {isUploading ? 'Uploading...' : 'Upload Image to Supabase'}
          </Button>
        )}
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!productName || !productPrice || !imageUrl || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating Product...' : 'Create Product'}
      </Button>
    </form>
  );
}
