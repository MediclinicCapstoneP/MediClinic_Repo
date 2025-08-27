-- Fix RLS Policy for Clinic Display
-- This script ensures that approved clinics can be viewed by patients

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- Drop any existing policies that might be blocking access
DROP POLICY IF EXISTS "Public read access for approved clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics are publicly readable when approved" ON clinics;
DROP POLICY IF EXISTS "Allow public read access to approved clinics" ON clinics;

-- Create a new RLS policy that allows anyone to read approved clinics
CREATE POLICY "public_read_approved_clinics" 
ON clinics 
FOR SELECT 
USING (status = 'approved');

-- Ensure RLS is enabled on the clinics table
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON clinics TO anon;
GRANT SELECT ON clinics TO authenticated;

-- Test the policy by checking if we can query approved clinics
-- This should return your OHARA clinic
SELECT 
    id,
    clinic_name,
    email,
    phone,
    city,
    status,
    created_at
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Double-check the count
SELECT COUNT(*) as approved_clinics_count 
FROM clinics 
WHERE status = 'approved';

-- Show the final policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';