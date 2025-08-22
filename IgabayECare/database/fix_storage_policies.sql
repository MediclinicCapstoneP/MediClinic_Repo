-- Fix Storage Bucket Access Issues
-- This script sets up proper storage policies for the user-uploads bucket

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 3. Create comprehensive storage policies

-- Policy 1: Allow public read access to profile pictures
CREATE POLICY "Public read access for profile pictures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = 'profile-pictures'
  );

-- Policy 2: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.role() = 'authenticated'
);

-- Policy 3: Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 4: Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[2]
  );

-- Policy 5: Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. Create a function to help with file path validation
CREATE OR REPLACE FUNCTION validate_file_path(file_path text, user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the file path follows the expected pattern
  -- Format: profile-pictures/{userType}/{userId}_{timestamp}.{extension}
  RETURN file_path ~ '^profile-pictures/(patient|clinic|doctor)/[^/]+_[0-9]+\.[a-zA-Z0-9]+$';
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function to get user's files
CREATE OR REPLACE FUNCTION get_user_files(user_uuid uuid)
RETURNS TABLE (
  name text,
  id uuid,
  updated_at timestamptz,
  created_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name,
    o.id,
    o.updated_at,
    o.created_at,
    o.last_accessed_at,
    o.metadata
  FROM storage.objects o
  WHERE o.bucket_id = 'user-uploads'
    AND o.name LIKE 'profile-pictures/%/' || user_uuid::text || '%'
    AND auth.uid() = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

-- 7. Create a trigger to automatically set metadata
CREATE OR REPLACE FUNCTION set_file_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.metadata = COALESCE(NEW.metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'uploaded_by', auth.uid(),
      'uploaded_at', now(),
      'file_type', CASE 
        WHEN NEW.name LIKE '%.jpg' OR NEW.name LIKE '%.jpeg' THEN 'image/jpeg'
        WHEN NEW.name LIKE '%.png' THEN 'image/png'
        WHEN NEW.name LIKE '%.gif' THEN 'image/gif'
        WHEN NEW.name LIKE '%.webp' THEN 'image/webp'
        ELSE 'unknown'
      END
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new file uploads
DROP TRIGGER IF EXISTS set_file_metadata_trigger ON storage.objects;
CREATE TRIGGER set_file_metadata_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION set_file_metadata();

-- 8. Create a view for easier file management
CREATE OR REPLACE VIEW user_profile_files AS
SELECT 
  o.name as file_path,
  o.id as file_id,
  o.created_at,
  o.updated_at,
  o.metadata,
  (storage.foldername(o.name))[1] as folder_type,
  (storage.foldername(o.name))[2] as user_type,
  (storage.foldername(o.name))[3] as file_name
FROM storage.objects o
WHERE o.bucket_id = 'user-uploads'
  AND o.name LIKE 'profile-pictures/%'
  AND auth.uid()::text = (storage.foldername(o.name))[2];

-- Grant access to the view
GRANT SELECT ON user_profile_files TO authenticated;

-- 9. Create a function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS integer AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete files that don't have corresponding user profiles
  DELETE FROM storage.objects 
  WHERE bucket_id = 'user-uploads'
    AND name LIKE 'profile-pictures/%'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = (storage.foldername(storage.objects.name))[2]
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner ON storage.objects(owner);

-- 11. Insert a test record to verify the setup (optional)
-- This helps verify that the policies are working correctly
DO $$
BEGIN
  -- Only insert if we have a test user
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'user-uploads',
      'profile-pictures/patient/test-user_' || extract(epoch from now())::text || '.jpg',
      (SELECT id FROM auth.users LIMIT 1),
      '{"test": true, "uploaded_at": "' || now()::text || '"}'
    );
  END IF;
END $$;

-- 12. Create a function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  total_files integer,
  total_size bigint,
  file_types jsonb
) AS $$
BEGIN
  RETURN QUERY
SELECT 
    COUNT(*)::integer as total_files,
    COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size,
    jsonb_object_agg(
      COALESCE(metadata->>'file_type', 'unknown'),
      COUNT(*)
    ) as file_types
  FROM storage.objects
  WHERE bucket_id = 'user-uploads'
    AND name LIKE 'profile-pictures/%/' || user_uuid::text || '%';
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_storage_stats(uuid) TO authenticated;

-- 13. Final verification query
-- This should return the policies we just created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 14. Show current storage objects (if any exist)
SELECT 
  name,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'user-uploads'
ORDER BY created_at DESC
LIMIT 10; 