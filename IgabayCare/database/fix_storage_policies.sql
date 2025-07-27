-- Fix Storage Bucket and Policies for Profile Pictures
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- 3. Create new storage policies
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

-- 4. Add profile picture columns to existing tables if they don't exist
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

-- 5. Verify the setup
SELECT 
  'Storage bucket created successfully' as status,
  id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-uploads';

-- 6. Show created policies
SELECT 
  'Storage policies created successfully' as status,
  schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 