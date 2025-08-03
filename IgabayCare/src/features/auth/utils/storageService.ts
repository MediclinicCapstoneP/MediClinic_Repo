import { supabase } from '../../../supabaseClient';

export interface UploadResult {
  success: boolean;
  error?: string;
  url?: string;
  path?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export const storageService = {
  // Upload profile picture
  async uploadProfilePicture(
    userId: string, 
    file: File, 
    userType: 'patient' | 'clinic' | 'doctor' = 'patient'
  ): Promise<UploadResult> {
    try {
      console.log('Starting profile picture upload for user:', userId, 'type:', userType);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        return { success: false, error: 'File must be an image' };
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        return { success: false, error: 'File size must be less than 5MB' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userType}_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${userType}/${fileName}`;

      console.log('Generated file path:', filePath);

      // Check if bucket exists and is accessible
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        return { success: false, error: 'Storage service error: ' + bucketError.message };
      }

      console.log('Available buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));

      // Try to access the user-uploads bucket directly
      let targetBucket = buckets?.find(b => b.id === 'user-uploads');
      
      if (!targetBucket) {
        console.error('user-uploads bucket not found. Available buckets:', buckets);
        return { 
          success: false, 
          error: 'Storage bucket "user-uploads" not found. Please run the storage setup script in your Supabase SQL editor.' 
        };
      }

      console.log('Using bucket:', targetBucket.id);
      
      // Test bucket access by trying to list files
      const { data: testFiles, error: testError } = await supabase.storage
        .from('user-uploads')
        .list('profile-pictures', { limit: 1 });
      
      if (testError) {
        console.error('Bucket access test failed:', testError);
        console.log('This might be due to missing storage policies. Please run the storage setup script.');
        return { 
          success: false, 
          error: 'Storage bucket access denied. Please check storage policies in Supabase.' 
        };
      }

      console.log('Using bucket:', targetBucket.id);

      // Upload file to the found bucket
      const { data, error } = await supabase.storage
        .from(targetBucket.id)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error
        });
        return { success: false, error: `Upload failed: ${error.message}` };
      }

      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(targetBucket.id)
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      console.log('Profile picture uploaded successfully:', filePath);
      
      return { 
        success: true, 
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Exception during upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      return { success: false, error: errorMessage };
    }
  },

  // Delete profile picture
  async deleteProfilePicture(filePath: string): Promise<DeleteResult> {
    try {
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      console.log('Profile picture deleted successfully:', filePath);
      return { success: true };
    } catch (error) {
      console.error('Exception during delete:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      return { success: false, error: errorMessage };
    }
  },

  // Get profile picture URL
  getProfilePictureUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Update profile picture (delete old + upload new)
  async updateProfilePicture(
    userId: string,
    newFile: File,
    oldFilePath?: string,
    userType: 'patient' | 'clinic' | 'doctor' = 'patient'
  ): Promise<UploadResult> {
    try {
      // Delete old file if it exists
      if (oldFilePath) {
        await this.deleteProfilePicture(oldFilePath);
      }

      // Upload new file
      return await this.uploadProfilePicture(userId, newFile, userType);
    } catch (error) {
      console.error('Exception during update:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      return { success: false, error: errorMessage };
    }
  },

  // Validate image file
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File must be an image (JPEG, PNG, GIF, etc.)' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }

    // Check file dimensions (optional - can be done client-side)
    return { isValid: true };
  },

  // Generate thumbnail URL (for preview)
  async generateThumbnail(file: File, maxWidth: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}; 