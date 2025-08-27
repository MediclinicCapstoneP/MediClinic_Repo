import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Building, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { storageService } from '../../features/auth/utils/storageService';
import { upload } from '../../features/auth/utils/storage';
import { patientService } from '../../features/auth/utils/patientService';
import { clinicService } from '../../features/auth/utils/clinicService';

interface ProfilePictureProps {
  currentImageUrl?: string;
  currentImagePath?: string;
  userId: string;
  userType: 'patient' | 'clinic' | 'doctor';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onImageUpdate?: (url: string, path: string) => void;
  onImageDelete?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  currentImageUrl,
  currentImagePath,
  userId,
  userType,
  size = 'md',
  onImageUpdate,
  onImageDelete,
  disabled = false,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  // Icon sizes
  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  };

const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 🔥 Step 1: Create a local preview
  const preview = URL.createObjectURL(file);
  setPreviewUrl(preview);

  setIsUploading(true);
  setError(null);

  try {
    // 🔥 Step 2: Upload to Supabase
    const uniqueFilePath = `images/${Date.now()}_${file.name}`;
    const publicUrl = await upload(file, uniqueFilePath);

    if (!publicUrl) throw new Error("Failed to upload profile picture");

    // 🔥 Step 3: Update user record with appropriate service
    if (userType === 'clinic') {
      await clinicService.updateClinicProfilePicture(userId, publicUrl);
    } else {
      // For patients and doctors, use patientService
      await patientService.updateProfilePicture(userId, publicUrl);
    }

    // 🔥 Step 4: Use the uploaded image as the new current image
    onImageUpdate?.(publicUrl, uniqueFilePath);

    setPreviewUrl(publicUrl);
  } catch (err: any) {
    console.error("Upload error:", err);
    setError("Failed to upload image");
  } finally {
    setIsUploading(false);
  }
};


  const handleDelete = async () => {
    if (!currentImagePath) return;

    setIsUploading(true);
    try {
      const result = await storageService.deleteProfilePicture(currentImagePath);
      if (result.success) {
        onImageDelete?.();
      } else {
        setError(result.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    } finally {
      setIsUploading(false);
    }
  };

const getDisplayImage = () => {
  if (previewUrl) return previewUrl;  // stays until replaced by publicUrl
  if (currentImageUrl) return currentImageUrl;
  return null;
};


  const getDefaultIcon = () => {
    const iconSize = iconSizes[size];
    switch (userType) {
      case 'clinic':
        return <Building size={iconSize} className="text-gray-400" />;
      case 'doctor':
        return <User size={iconSize} className="text-gray-400" />;
      default:
        return <User size={iconSize} className="text-gray-400" />;
    }
  };

  const getDefaultBackground = () => {
    switch (userType) {
      case 'clinic':
        return 'bg-secondary-100';
      case 'doctor':
        return 'bg-primary-100';
      default:
        return 'bg-primary-100';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200`}>
        {getDisplayImage() ? (
          <img
            src={getDisplayImage()!}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${getDefaultBackground()}`}>
            {getDefaultIcon()}
          </div>
        )}

        {/* Upload Overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-gray-900 hover:bg-gray-50"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
            </Button>
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!disabled && (
        <div className="absolute -bottom-2 -right-2 flex space-x-1">
          {/* Upload Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-8 h-8 p-0 bg-white shadow-md hover:bg-gray-50"
          >
            {isUploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
          </Button>

          {/* Delete Button */}
          {currentImageUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading}
              className="w-8 h-8 p-0 bg-white shadow-md hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
            >
              <X size={12} />
            </Button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}; 