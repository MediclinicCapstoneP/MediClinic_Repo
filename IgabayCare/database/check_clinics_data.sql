-- Check Clinics Data in Supabase
-- Run this in your Supabase SQL Editor to see what clinics are available

-- 1. Check all clinics in the database
SELECT 
    id,
    clinic_name,
    email,
    status,
    created_at,
    updated_at,
    city,
    state,
    number_of_doctors,
    year_established
FROM clinics
ORDER BY created_at DESC;

-- 2. Check only approved clinics (these will show on patient home page)
SELECT 
    id,
    clinic_name,
    email,
    status,
    created_at,
    city,
    state,
    number_of_doctors,
    year_established
FROM clinics
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 3. Count clinics by status
SELECT 
    status,
    COUNT(*) as count
FROM clinics
GROUP BY status;

-- 4. Check if there are any clinics at all
SELECT COUNT(*) as total_clinics FROM clinics;

-- 5. Check clinics with their specialties (if clinic_specialties table exists)
SELECT 
    c.id,
    c.clinic_name,
    c.status,
    cs.specialty_name,
    cs.is_custom
FROM clinics c
LEFT JOIN clinic_specialties cs ON c.id = cs.clinic_id
WHERE c.status = 'approved'
ORDER BY c.clinic_name, cs.specialty_name;

-- 6. Update clinic status to approved (if needed)
-- Uncomment and modify the clinic ID if you want to approve a specific clinic
-- UPDATE clinics 
-- SET status = 'approved', updated_at = NOW()
-- WHERE id = 'your-clinic-id-here';

-- 7. Insert a test clinic if no clinics exist
-- Uncomment and run this if you want to add a test clinic
/*
INSERT INTO clinics (
    id,
    user_id,
    clinic_name,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    number_of_doctors,
    year_established,
    description,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000', -- dummy user_id
    'Test Medical Clinic',
    'test@clinic.com',
    '+1234567890',
    '123 Test Street',
    'Test City',
    'Test State',
    '12345',
    5,
    2020,
    'A test clinic for demonstration purposes',
    'approved',
    NOW(),
    NOW()
);
*/ 