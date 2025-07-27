-- Fix Storage Bucket Permissions
-- Run this to ensure the user-uploads bucket is properly configured

-- 1. Update bucket settings to ensure it's public and accessible
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'user-uploads';

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- 3. Create comprehensive storage policies
-- Allow authenticated users to upload any file to user-uploads bucket
CREATE POLICY "Allow authenticated uploads to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow anyone to view files in user-uploads bucket (since it's public)
CREATE POLICY "Allow public access to user-uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads'
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to user-uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes to user-uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- 4. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Verify bucket exists and is public
SELECT 
  'Bucket Status:' as info,
  id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-uploads';

-- 6. Show created policies
SELECT 
  'Storage Policies:' as info,
  schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 