-- Fix RLS policies for clinics table
-- This script fixes the Row Level Security policies to allow proper clinic registration

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can delete own profile" ON clinics;

-- Create new policies that allow proper registration and access

-- Policy for INSERT: Allow users to create their own clinic profile
CREATE POLICY "Clinics can insert own profile" ON clinics
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy for SELECT: Allow users to view their own clinic profile
CREATE POLICY "Clinics can view own profile" ON clinics
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for UPDATE: Allow users to update their own clinic profile
CREATE POLICY "Clinics can update own profile" ON clinics
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Allow users to delete their own clinic profile
CREATE POLICY "Clinics can delete own profile" ON clinics
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- Test the policies by checking if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clinics'; 