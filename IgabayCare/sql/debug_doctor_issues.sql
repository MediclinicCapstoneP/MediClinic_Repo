-- Debug script to identify doctor-related issues
-- Run this in your Supabase SQL Editor to check database state

-- 1. Check if doctors table exists and its structure
SELECT 'DOCTORS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any doctors in the database
SELECT 'DOCTORS COUNT:' as info;
SELECT COUNT(*) as total_doctors FROM public.doctors;

-- 3. Check for doctors with null or empty IDs
SELECT 'DOCTORS WITH INVALID IDS:' as info;
SELECT id, user_id, full_name, email, created_at
FROM public.doctors 
WHERE id IS NULL OR user_id IS NULL
ORDER BY created_at DESC;

-- 4. Show sample doctor records
SELECT 'SAMPLE DOCTOR RECORDS:' as info;
SELECT id, user_id, full_name, email, specialization, status, created_at, updated_at
FROM public.doctors 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check auth.users for doctor role users
SELECT 'AUTH USERS WITH DOCTOR ROLE:' as info;
SELECT id, email, email_confirmed_at, user_metadata->>'role' as role, created_at
FROM auth.users 
WHERE user_metadata->>'role' = 'doctor'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check for orphaned auth users (users without doctor profiles)
SELECT 'ORPHANED AUTH USERS (doctors without profiles):' as info;
SELECT au.id, au.email, au.user_metadata->>'role' as role, au.created_at
FROM auth.users au
LEFT JOIN public.doctors d ON au.id = d.user_id
WHERE au.user_metadata->>'role' = 'doctor' 
AND d.user_id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;

-- 7. Check for orphaned doctor profiles (profiles without auth users)
SELECT 'ORPHANED DOCTOR PROFILES (profiles without auth users):' as info;
SELECT d.id, d.user_id, d.full_name, d.email, d.created_at
FROM public.doctors d
LEFT JOIN auth.users au ON d.user_id = au.id
WHERE au.id IS NULL
ORDER BY d.created_at DESC
LIMIT 5;

-- 8. Check appointments table for doctor relationships
SELECT 'APPOINTMENTS WITH DOCTOR RELATIONSHIPS:' as info;
SELECT 
    a.id, 
    a.doctor_id, 
    d.full_name as doctor_name,
    a.doctor_specialty,
    a.status,
    a.appointment_date
FROM public.appointments a
LEFT JOIN public.doctors d ON a.doctor_id = d.id
WHERE a.doctor_id IS NOT NULL
ORDER BY a.appointment_date DESC
LIMIT 5;

-- 9. Show database permissions for doctors table
SELECT 'DOCTORS TABLE PERMISSIONS:' as info;
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'doctors' AND schemaname = 'public';

-- 10. Show RLS policies for doctors table
SELECT 'DOCTORS TABLE RLS POLICIES:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'doctors' AND schemaname = 'public';

-- 11. Check for any recent error logs or activity
SELECT 'RECENT DOCTOR UPDATES:' as info;
SELECT id, full_name, email, status, updated_at
FROM public.doctors
WHERE updated_at >= NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC
LIMIT 10;