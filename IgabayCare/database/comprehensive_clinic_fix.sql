-- COMPREHENSIVE CLINIC DISPLAY DIAGNOSTIC AND FIX SCRIPT
-- Run this entire script in your Supabase SQL Editor

-- ===== STEP 1: DIAGNOSTIC CHECKS =====
SELECT '=== DIAGNOSTIC PHASE ===' as phase;

-- Check 1: Does the clinics table exist?
SELECT 'Check 1: Table existence' as check_name;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics'
) as table_exists;

-- Check 2: How many total clinics exist?
SELECT 'Check 2: Total clinic count' as check_name;
SELECT COUNT(*) as total_clinics FROM clinics;

-- Check 3: How many approved clinics exist?
SELECT 'Check 3: Approved clinic count' as check_name;
SELECT COUNT(*) as approved_clinics FROM clinics WHERE status = 'approved';

-- Check 4: Show all clinic data
SELECT 'Check 4: All clinic data' as check_name;
SELECT 
    id,
    clinic_name,
    email,
    phone,
    city,
    status,
    created_at
FROM clinics 
ORDER BY created_at DESC;

-- Check 5: Current RLS policies
SELECT 'Check 5: Current RLS policies' as check_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'clinics';

-- Check 6: Table permissions
SELECT 'Check 6: Table permissions' as check_name;
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'clinics' 
AND table_schema = 'public';

-- ===== STEP 2: FIX PHASE =====
SELECT '=== FIX PHASE ===' as phase;

-- Fix 1: Enable RLS if not already enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Fix 2: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public read access for approved clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics are publicly readable when approved" ON clinics;
DROP POLICY IF EXISTS "Allow public read access to approved clinics" ON clinics;
DROP POLICY IF EXISTS "public_read_approved_clinics" ON clinics;
DROP POLICY IF EXISTS "Enable read access for all users" ON clinics;

-- Fix 3: Create the correct policy for public access to approved clinics
CREATE POLICY "allow_public_read_approved_clinics" 
ON clinics 
FOR SELECT 
USING (status = 'approved');

-- Fix 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON clinics TO anon, authenticated;

-- Fix 5: Ensure your OHARA clinic has the correct status
UPDATE clinics 
SET status = 'approved' 
WHERE clinic_name = 'OHARA' 
AND status != 'approved';

-- ===== STEP 3: VERIFICATION PHASE =====
SELECT '=== VERIFICATION PHASE ===' as phase;

-- Verify 1: Check the new policy was created
SELECT 'Verify 1: New policy created' as check_name;
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'clinics' 
AND policyname = 'allow_public_read_approved_clinics';

-- Verify 2: Test that approved clinics can be queried
SELECT 'Verify 2: Can query approved clinics' as check_name;
SELECT 
    clinic_name,
    email,
    phone,
    city,
    status
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Verify 3: Count approved clinics again
SELECT 'Verify 3: Final approved clinic count' as check_name;
SELECT COUNT(*) as approved_clinics_after_fix FROM clinics WHERE status = 'approved';

-- ===== EXPECTED RESULTS =====
-- After running this script, you should see:
-- 1. table_exists: true
-- 2. total_clinics: 1 (or more)
-- 3. approved_clinics: 1 (your OHARA clinic)
-- 4. Your OHARA clinic data displayed
-- 5. New RLS policy created
-- 6. Verification showing your clinic can be queried

SELECT '=== SCRIPT COMPLETE ===' as status;