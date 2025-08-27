-- RESTORE OHARA CLINIC DATA
-- This script will restore your OHARA clinic that was showing in your logs

-- First, let's check if the table exists and is empty
SELECT 'Current clinic count:' as check_name, COUNT(*) as count FROM clinics;

-- Check if OHARA clinic exists
SELECT 'OHARA clinic exists:' as check_name, COUNT(*) as count 
FROM clinics 
WHERE clinic_name = 'OHARA';

-- If the table is empty, restore your OHARA clinic data
-- (Based on the data you showed in your original message)
INSERT INTO clinics (
    id,
    user_id,
    clinic_name,
    email,
    phone,
    website,
    address,
    city,
    state,
    zip_code,
    license_number,
    accreditation,
    tax_id,
    year_established,
    specialties,
    custom_specialties,
    services,
    custom_services,
    operating_hours,
    number_of_doctors,
    number_of_staff,
    description,
    status,
    created_at,
    updated_at,
    profile_pic_url
) VALUES (
    '19631e43-5e2c-466d-84bc-9199123260d2',
    '33e97e4b-39d7-4137-abb8-0f693ec49f4b',
    'OHARA',
    'rexloverem@gmail.com',
    '098765432',
    'sfsdffad',
    'fsafafa',
    'agfaf',
    'agaga',
    '1232',
    '4563624532',
    '544123512',
    '325235',
    1990,
    '{"Cardiology","Dermatology","Psychiatry"}',
    '{}',
    '{"Vaccination","General Consultation","Physical Therapy","Mental Health Services"}',
    '{}',
    '{"friday": {"open": "08:00", "close": "18:00"}, "monday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "14:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "16:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}}',
    5,
    10,
    'hasjdhajhdjkhasjkda',
    'approved',
    '2025-08-26 13:29:12.232338+00',
    '2025-08-27 00:53:26.767393+00',
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    status = 'approved',
    updated_at = NOW();

-- Verify the clinic was inserted
SELECT 'After insert - clinic count:' as check_name, COUNT(*) as count FROM clinics;

-- Show the inserted clinic
SELECT 
    'Restored clinic data:' as info,
    clinic_name,
    email,
    phone,
    city,
    status,
    specialties
FROM clinics 
WHERE clinic_name = 'OHARA';

-- Ensure RLS policy exists for public access
CREATE POLICY IF NOT EXISTS "allow_public_read_approved_clinics" 
ON clinics 
FOR SELECT 
USING (status = 'approved');

-- Grant permissions
GRANT SELECT ON clinics TO anon, authenticated;

SELECT 'Setup complete! Your OHARA clinic should now be visible.' as final_status;