-- Create Storage Policies for Profile Pictures
-- Run this AFTER manually creating the 'user-uploads' bucket

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- 2. Create new storage policies
-- Allow authenticated users to upload profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'profile-pictures'
  );

-- Allow anyone to view profile pictures (public access)
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
    (storage.foldername(name))[1] = 'profile-pictures'
  );

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'profile-pictures'
  );

-- 3. Add profile picture columns to existing tables if they don't exist
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

-- 4. Verify the setup
SELECT 'Storage policies created successfully' as status; 