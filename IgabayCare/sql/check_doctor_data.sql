-- Quick check of your doctor data
-- Run this in Supabase SQL Editor to see current state

-- 1. Check if any doctors exist
SELECT 'TOTAL DOCTORS:' as info;
SELECT COUNT(*) as total_doctors FROM public.doctors;

-- 2. Show sample doctor records (if any)
SELECT 'SAMPLE DOCTOR RECORDS:' as info;
SELECT 
    id, 
    user_id,
    full_name, 
    email, 
    specialization, 
    status,
    clinic_id,
    created_at
FROM public.doctors 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check for doctors without user_id (potential orphaned records)
SELECT 'DOCTORS WITHOUT USER_ID:' as info;
SELECT 
    id, 
    full_name, 
    email, 
    specialization, 
    status,
    created_at
FROM public.doctors 
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check auth.users with doctor role
SELECT 'AUTH USERS WITH DOCTOR ROLE:' as info;
SELECT 
    id, 
    email, 
    email_confirmed_at,
    user_metadata->>'role' as role,
    created_at
FROM auth.users 
WHERE user_metadata->>'role' = 'doctor'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check for mismatched doctor-auth relationships
SELECT 'MISMATCHED DOCTOR-AUTH RELATIONSHIPS:' as info;
-- Doctors without corresponding auth users
SELECT 
    'Doctor without auth user' as issue,
    d.id as doctor_id,
    d.full_name,
    d.email,
    d.user_id
FROM public.doctors d
LEFT JOIN auth.users au ON d.user_id = au.id
WHERE d.user_id IS NOT NULL AND au.id IS NULL
LIMIT 5;

-- 6. Check appointments table structure for doctor_specialty column
SELECT 'APPOINTMENTS TABLE DOCTOR_SPECIALTY CHECK:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public' 
AND column_name = 'doctor_specialty';