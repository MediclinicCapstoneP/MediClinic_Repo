-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile pictures
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'profile-pictures' AND
    (storage.foldername(name))[2] IN ('patient', 'clinic', 'doctor')
  );

-- Allow users to view profile pictures
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = 'profile-pictures'
  );

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'profile-pictures' AND
    (storage.foldername(name))[2] IN ('patient', 'clinic', 'doctor')
  );

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'profile-pictures' AND
    (storage.foldername(name))[2] IN ('patient', 'clinic', 'doctor')
  );

-- Add profile picture columns to existing tables if they don't exist
DO $$ 
BEGIN
  -- Add profile picture columns to patients table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE public.patients ADD COLUMN profile_picture_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'profile_picture_path') THEN
    ALTER TABLE public.patients ADD COLUMN profile_picture_path text;
  END IF;

  -- Add profile picture columns to clinics table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'clinics' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE public.clinics ADD COLUMN profile_picture_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'clinics' AND column_name = 'profile_picture_path') THEN
    ALTER TABLE public.clinics ADD COLUMN profile_picture_path text;
  END IF;
END $$; 