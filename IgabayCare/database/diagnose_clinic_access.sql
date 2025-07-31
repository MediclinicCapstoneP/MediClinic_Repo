-- Diagnostic script to troubleshoot clinic access issues
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if the user exists and their role
SELECT 
    'Current authenticated user:' as info,
    auth.uid() as user_id,
    auth.role() as user_role,
    auth.email() as user_email;

-- 2. Check if the user has a clinic profile
SELECT 
    'Clinic profile check:' as info,
    COUNT(*) as clinic_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Clinic profile exists'
        ELSE 'No clinic profile found'
    END as status
FROM clinics 
WHERE user_id = auth.uid();

-- 3. Check all clinics for this user (if any exist)
SELECT 
    'User clinics:' as info,
    id,
    clinic_name,
    email,
    status,
    created_at
FROM clinics 
WHERE user_id = auth.uid();

-- 4. Check RLS policies on clinics table
SELECT 
    'RLS Policies:' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clinics'
ORDER BY policyname;

-- 5. Check if RLS is enabled on clinics table
SELECT 
    'RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'clinics';

-- 6. Test a simple SELECT query to see what happens
SELECT 
    'Test query result:' as info,
    COUNT(*) as total_clinics,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Query successful'
        ELSE 'No data returned'
    END as query_status
FROM clinics;

-- 7. Check if there are any clinics at all in the table
SELECT 
    'All clinics count:' as info,
    COUNT(*) as total_clinics_in_table
FROM clinics;

-- 8. Check user metadata (if available)
-- Note: This might not work in all contexts
SELECT 
    'User metadata check:' as info,
    CASE 
        WHEN auth.jwt() IS NOT NULL THEN 'JWT available'
        ELSE 'No JWT'
    END as jwt_status; 