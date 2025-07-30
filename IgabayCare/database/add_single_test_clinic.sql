-- Add a single test clinic to verify display
-- Run this in your Supabase SQL Editor

-- Add one test clinic
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
    '00000000-0000-0000-0000-000000000001',
    'Rex Medical Clinic',
    'rexloverem@gmail.com',
    '+1234567890',
    '123 Medical Center Dr',
    'Your City',
    'Your State',
    '12345',
    3,
    2020,
    'A comprehensive medical clinic providing quality healthcare services to our community.',
    'approved',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Check if it was added
SELECT 
    clinic_name,
    email,
    status,
    created_at
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC; 