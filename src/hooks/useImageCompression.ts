import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

interface UseImageCompressionReturn {
  isCompressing: boolean;
  error: string | null;
  compressImage: (file: File, options?: CompressionOptions) => Promise<File | null>;
  getPreviewUrl: (file: File) => string;
}

/**
 * Hook for compressing images in the browser
 * Uses browser-image-compression library
 * 
 * @param onSuccess - Callback when compression succeeds
 * @param onError - Callback when compression fails
 * @returns Compression utilities and state
 */
export function useImageCompression(
  onSuccess?: (file: File) => void,
  onError?: (error: string) => void
): UseImageCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = useCallback(
    async (file: File, options: CompressionOptions = {}): Promise<File | null> => {
      try {
        setError(null);
        setIsCompressing(true);

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          throw new Error('Invalid file type. Please use JPEG, PNG, WebP, or GIF.');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File is too large. Maximum size is 10MB.');
        }

        // Compression options
        const compressionOptions = {
          maxSizeMB: options.maxSizeMB || 1, // Target compressed size: 1MB
          maxWidthOrHeight: options.maxWidthOrHeight || 500, // Max width/height: 500px
          useWebWorker: options.useWebWorker !== false, // Use web worker for performance
        };

        // Compress image
        const compressedFile = await imageCompression(file, compressionOptions);

        // Create proper File object with timestamp
        const finalFile = new File(
          [compressedFile],
          `image-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`,
          { type: 'image/jpeg' }
        );

        setIsCompressing(false);
        onSuccess?.(finalFile);
        return finalFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to compress image';
        setError(errorMessage);
        setIsCompressing(false);
        onError?.(errorMessage);
        return null;
      }
    },
    [onSuccess, onError]
  );

  const getPreviewUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  return {
    isCompressing,
    error,
    compressImage,
    getPreviewUrl,
  };
}
