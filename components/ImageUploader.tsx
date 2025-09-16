import { useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import { 
  PhotoIcon, 
  XMarkIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  onImagesChange: (imageUrls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
  bucketName?: string;
  folderPath?: string;
}

export default function ImageUploader({
  onImagesChange,
  existingImages = [],
  maxImages = 5,
  bucketName = 'pg-images',
  folderPath = 'listings'
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        setError('Please select only image files');
        return false;
      }
      
      if (!isValidSize) {
        setError('Image size should be less than 5MB');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;
        
        // Track upload progress
        const progressKey = `${file.name}-${index}`;
        setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      
      setImages(newImages);
      onImagesChange(newImages);
      
      // Clear progress tracking
      setUploadProgress({});
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // If it's a Supabase storage URL, try to delete it
      if (imageUrl.includes(bucketName)) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${folderPath}/${fileName}`;
        
        await supabase.storage
          .from(bucketName)
          .remove([filePath]);
      }
      
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from UI even if backend delete fails
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Property Images
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {images.length} of {maxImages} images uploaded
          </p>
        </div>
        <button
          type="button"
          onClick={openFileDialog}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <CloudArrowUpIcon className="h-5 w-5" />
          )}
          <span>{uploading ? 'Uploading...' : 'Add Images'}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-all duration-300">
                <Image
                  src={imageUrl}
                  alt={`Uploaded image ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={() => removeImage(imageUrl, index)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all duration-200 shadow-lg"
                      aria-label="Remove image"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Image Index Badge */}
              <div className="absolute top-2 left-2">
                <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
                  {index + 1}
                </span>
              </div>
              
              {/* Primary Image Badge */}
              {index === 0 && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
                    Main
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
      <div 
        onClick={openFileDialog}
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer group"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
          <PhotoIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Images</h3>
        <p className="text-gray-600 mb-2">Drag & drop or click to browse</p>
        <p className="text-sm text-gray-500">
          PNG, JPG, GIF up to 5MB each • Maximum {maxImages} images
        </p>
      </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-500">
        <p>• First image will be used as the main thumbnail</p>
        <p>• Drag to reorder images (feature can be added)</p>
        <p>• Maximum {maxImages} images allowed</p>
      </div>
    </div>
  );
}
