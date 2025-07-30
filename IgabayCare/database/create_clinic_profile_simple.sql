-- Simple clinic profile creation for user b3900f83-d64e-45e3-93e4-6bae15dde9ba
-- This creates a basic clinic profile that can be updated later through the dashboard

-- Check current user info
SELECT 
    'Current User:' as info,
    id,
    email,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba';

-- Create basic clinic profile
INSERT INTO clinics (
    user_id,
    clinic_name,
    email,
    status,
    created_at,
    updated_at
) VALUES (
    'b3900f83-d64e-45e3-93e4-6bae15dde9ba',
    'My Clinic',
    'clinic@example.com',
    'pending',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the clinic was created
SELECT 
    'Clinic Created:' as info,
    id,
    clinic_name,
    email,
    status,
    created_at
FROM clinics 
WHERE user_id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba'; 