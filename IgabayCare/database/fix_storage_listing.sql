-- Fix Storage Bucket Listing Permissions
-- This script fixes the issue where authenticated users can't list storage buckets

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- 3. Create comprehensive storage policies that allow bucket listing
-- Allow authenticated users to list files in user-uploads bucket
CREATE POLICY "Allow authenticated users to list user-uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload to user-uploads bucket
CREATE POLICY "Allow authenticated users to upload to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update files in user-uploads bucket
CREATE POLICY "Allow authenticated users to update user-uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete files in user-uploads bucket
CREATE POLICY "Allow authenticated users to delete user-uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
    auth.role() = 'authenticated'
  );

-- 4. Also allow public access for viewing (since bucket is public)
CREATE POLICY "Allow public access to user-uploads files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads'
  );

-- 5. Verify the bucket exists and is public
SELECT 
  'Bucket Status:' as info,
  id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-uploads';

-- 6. Show created policies
SELECT 
  'Storage Policies:' as info,
  policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname; 