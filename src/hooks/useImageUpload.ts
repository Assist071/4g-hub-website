import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseImageUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadImage: (file: File, bucket?: string) => Promise<string | null>;
  getPublicUrl: (path: string, bucket?: string) => string;
}

/**
 * Hook for uploading images to Supabase Storage
 * Handles file upload and returns public URL
 * 
 * @param onSuccess - Callback when upload succeeds with URL
 * @param onError - Callback when upload fails
 * @returns Upload utilities and state
 */
export function useImageUpload(
  onSuccess?: (url: string) => void,
  onError?: (error: string) => void
): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File, bucket: string = 'products'): Promise<string | null> => {
      try {
        setError(null);
        setIsUploading(true);

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${random}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600', // Cache for 1 hour
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload image');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        setIsUploading(false);
        onSuccess?.(publicUrl);
        return publicUrl;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        setIsUploading(false);
        onError?.(errorMessage);
        return null;
      }
    },
    [onSuccess, onError]
  );

  const getPublicUrl = useCallback((path: string, bucket: string = 'products'): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return {
    isUploading,
    error,
    uploadImage,
    getPublicUrl,
  };
}
