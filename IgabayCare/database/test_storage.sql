-- Test Storage Setup
-- Run this to check your current storage configuration

-- 1. Check if storage buckets exist
SELECT 
  'Available Storage Buckets:' as info,
  id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- 2. Check if user-uploads bucket exists specifically
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-uploads') 
    THEN '✅ user-uploads bucket EXISTS'
    ELSE '❌ user-uploads bucket DOES NOT EXIST'
  END as bucket_status;

-- 3. Check storage policies
SELECT 
  'Storage Policies:' as info,
  schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Check if profile picture columns exist
SELECT 
  'Database Columns:' as info,
  table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name IN ('patients', 'clinics') 
  AND column_name LIKE '%profile_picture%'
ORDER BY table_name, column_name; 