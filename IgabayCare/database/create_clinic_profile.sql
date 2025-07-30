-- Create clinic profile for user who doesn't have one
-- Replace the values below with the actual user's information

-- First, let's check if the user exists in auth.users
SELECT 
    'User Check:' as info,
    id,
    email,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba';

-- Check if a clinic profile already exists
SELECT 
    'Existing Clinic Check:' as info,
    COUNT(*) as clinic_count
FROM clinics 
WHERE user_id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba';

-- Create a basic clinic profile (only run if no clinic exists)
-- Uncomment and modify the values below to create the clinic profile
/*
INSERT INTO clinics (
    user_id,
    clinic_name,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    license_number,
    year_established,
    specialties,
    services,
    number_of_doctors,
    number_of_staff,
    description,
    status,
    created_at,
    updated_at
) VALUES (
    'b3900f83-d64e-45e3-93e4-6bae15dde9ba', -- User ID from the error
    'Your Clinic Name', -- Replace with actual clinic name
    'clinic@example.com', -- Replace with actual email
    '+1234567890', -- Replace with actual phone
    '123 Main Street', -- Replace with actual address
    'City Name', -- Replace with actual city
    'State', -- Replace with actual state
    '12345', -- Replace with actual zip code
    'LIC123456', -- Replace with actual license number
    2020, -- Replace with actual year established
    ARRAY['General Medicine', 'Pediatrics'], -- Replace with actual specialties
    ARRAY['Consultation', 'Vaccination'], -- Replace with actual services
    5, -- Replace with actual number of doctors
    10, -- Replace with actual number of staff
    'A comprehensive healthcare facility providing quality medical services to our community.', -- Replace with actual description
    'pending', -- Status (pending, approved, rejected)
    NOW(),
    NOW()
);
*/

-- After creating the profile, verify it was created
SELECT 
    'Verification:' as info,
    id,
    clinic_name,
    email,
    status,
    created_at
FROM clinics 
WHERE user_id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba'; 