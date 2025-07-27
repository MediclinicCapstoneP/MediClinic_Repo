-- Test script to verify database connection and RLS policies
-- Run this in your Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'clinics', 'appointments');

-- 2. Check if RLS is enabled on patients table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- 3. Check existing policies for patients table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';

-- 4. Check the structure of patients table
\d patients;

-- 5. Test if we can query the patients table (this should work for authenticated users)
-- Note: This will only work if you're authenticated
SELECT COUNT(*) FROM patients;

-- 6. Check if auth.users table exists and has data
SELECT COUNT(*) FROM auth.users;

-- 7. Verify the foreign key relationship
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='patients'; 