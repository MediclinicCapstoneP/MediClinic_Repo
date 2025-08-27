-- Quick Fix for Specific Clinic User
-- This script fixes the specific clinic that was mentioned in the issue
-- User ID: 7ac6d2c9-3c47-4c08-a7d2-fd77bbf43e0e
-- Clinic ID: 5c675870-7a3f-4e53-8fbe-7a5d95c0de6c

-- Update the existing clinic record to approved status and add sample complete data
UPDATE public.clinics 
SET 
    status = 'approved',
    phone = '+1234567890',
    address = '123 Medical Center Drive',
    city = 'Medical City',
    state = 'CA', 
    zip_code = '12345',
    license_number = 'CL-2024-001',
    description = 'A modern healthcare facility providing comprehensive medical services to the community.',
    specialties = '["General Medicine", "Family Practice"]'::jsonb,
    services = '["General Consultation", "Preventive Care", "Vaccination"]'::jsonb,
    number_of_doctors = 3,
    number_of_staff = 10,
    updated_at = NOW()
WHERE id = '5c675870-7a3f-4e53-8fbe-7a5d95c0de6c'
AND user_id = '7ac6d2c9-3c47-4c08-a7d2-fd77bbf43e0e';

-- Verify the update
SELECT 
    clinic_name,
    email, 
    phone,
    address,
    city,
    state,
    status,
    specialties,
    services,
    number_of_doctors,
    number_of_staff,
    description
FROM public.clinics 
WHERE id = '5c675870-7a3f-4e53-8fbe-7a5d95c0de6c';

-- Check if the user can now access their clinic dashboard
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.email_confirmed_at,
    c.clinic_name,
    c.status,
    c.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.clinics c ON c.user_id = u.id
WHERE u.id = '7ac6d2c9-3c47-4c08-a7d2-fd77bbf43e0e';