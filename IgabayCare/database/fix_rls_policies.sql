-- Comprehensive fix for RLS policies for patients table
-- This script ensures proper patient registration and access

-- First, ensure RLS is enabled on the patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for patients table
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can insert own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Patients can delete own profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for all users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON patients;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON patients;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON patients;

-- Create comprehensive policies for patients table

-- Policy for INSERT: Allow authenticated users to create their own patient profile
CREATE POLICY "Patients can insert own profile" ON patients
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Policy for SELECT: Allow users to view their own patient profile
CREATE POLICY "Patients can view own profile" ON patients
    FOR SELECT 
    USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Policy for UPDATE: Allow users to update their own patient profile
CREATE POLICY "Patients can update own profile" ON patients
    FOR UPDATE 
    USING (auth.uid() = user_id AND auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Policy for DELETE: Allow users to delete their own patient profile
CREATE POLICY "Patients can delete own profile" ON patients
    FOR DELETE 
    USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';

-- Test the policies by checking if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- Additional check: Ensure the patients table structure is correct
\d patients; 