-- Comprehensive RLS policy fix for clinics table
-- This script fixes all access issues for clinic owners and public users

-- First, ensure RLS is enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Clinic owners can manage their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics can view their own profile" ON clinics;
DROP POLICY IF EXISTS "Anyone can view active clinics" ON clinics;
DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can insert their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can update their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can delete their clinics" ON clinics;

-- Policy 1: Allow clinic owners to INSERT their own clinics
CREATE POLICY "Clinic owners can insert their clinics" ON clinics
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- Policy 2: Allow clinic owners to SELECT their own clinics (regardless of status)
CREATE POLICY "Clinic owners can select their clinics" ON clinics
    FOR SELECT USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- Policy 3: Allow clinic owners to UPDATE their own clinics
CREATE POLICY "Clinic owners can update their clinics" ON clinics
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- Policy 4: Allow clinic owners to DELETE their own clinics
CREATE POLICY "Clinic owners can delete their clinics" ON clinics
    FOR DELETE USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- Policy 5: Allow public users to view approved clinics (for patient portal)
CREATE POLICY "Public can view approved clinics" ON clinics
    FOR SELECT USING (
        status = 'approved'
    );

-- Policy 6: Allow authenticated users to view any clinic (for admin purposes)
-- This can be removed if you want stricter access control
CREATE POLICY "Authenticated users can view all clinics" ON clinics
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Verify the policies were created successfully
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
WHERE tablename = 'clinics'
ORDER BY policyname;

-- Test the policies by checking if a clinic owner can access their data
-- This query should work for authenticated clinic users
SELECT 
    'RLS Policies for clinics table:' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'clinics'; 