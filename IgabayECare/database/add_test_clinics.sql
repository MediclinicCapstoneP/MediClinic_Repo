-- Add Test Clinics to Supabase Database
-- Run this in your Supabase SQL Editor to add sample clinics

-- First, let's check if we have any clinics at all
SELECT 'Current clinics count:' as info, COUNT(*) as count FROM clinics;

-- Check clinics by status
SELECT 'Clinics by status:' as info, status, COUNT(*) as count 
FROM clinics 
GROUP BY status;

-- Add test clinics with approved status
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
    year_established,
    number_of_doctors,
    number_of_staff,
    description,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Rex Medical Clinic',
    'rexloverem@gmail.com',
    '+1234567890',
    'https://rexmedical.com',
    '123 Medical Center Dr',
    'Your City',
    'Your State',
    '12345',
    'LIC123456',
    2020,
    3,
    8,
    'A comprehensive medical clinic providing quality healthcare services to our community.',
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'QuickCare Medical Center',
    'info@quickcare.com',
    '+1234567891',
    'https://quickcare.com',
    '456 Health Avenue',
    'Medical District',
    'State',
    '12346',
    'LIC789012',
    2018,
    5,
    12,
    'Fast and reliable medical care for urgent health needs.',
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'Heart & Vascular Institute',
    'contact@heartinstitute.com',
    '+1234567892',
    'https://heartinstitute.com',
    '789 Cardiology Blvd',
    'Heart City',
    'State',
    '12347',
    'LIC345678',
    2015,
    8,
    15,
    'Specialized cardiac care and cardiovascular treatments.',
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'Family Health Clinic',
    'hello@familyhealth.com',
    '+1234567893',
    'https://familyhealth.com',
    '321 Family Street',
    'Family Town',
    'State',
    '12348',
    'LIC901234',
    2019,
    4,
    10,
    'Comprehensive family medicine and pediatric care.',
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'Dental Care Plus',
    'smile@dentalcare.com',
    '+1234567894',
    'https://dentalcare.com',
    '654 Dental Drive',
    'Smile City',
    'State',
    '12349',
    'LIC567890',
    2017,
    3,
    7,
    'Complete dental care and oral health services.',
    'approved',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Now add specialties for these clinics
-- First, let's get the clinic IDs we just created
WITH clinic_ids AS (
    SELECT id, clinic_name 
    FROM clinics 
    WHERE user_id IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005'
    )
)
INSERT INTO clinic_specialties (clinic_id, specialty_name, is_custom)
SELECT 
    c.id,
    s.specialty_name,
    false
FROM clinic_ids c
CROSS JOIN (
    VALUES 
        ('General Medicine'),
        ('Family Practice'),
        ('Internal Medicine'),
        ('Cardiology'),
        ('Dermatology'),
        ('Pediatrics'),
        ('Dental Care'),
        ('Emergency Medicine'),
        ('Preventive Care'),
        ('Vaccination')
) AS s(specialty_name)
WHERE 
    (c.clinic_name = 'Rex Medical Clinic' AND s.specialty_name IN ('General Medicine', 'Family Practice', 'Vaccination')) OR
    (c.clinic_name = 'QuickCare Medical Center' AND s.specialty_name IN ('Emergency Medicine', 'General Medicine', 'Preventive Care')) OR
    (c.clinic_name = 'Heart & Vascular Institute' AND s.specialty_name IN ('Cardiology', 'Internal Medicine')) OR
    (c.clinic_name = 'Family Health Clinic' AND s.specialty_name IN ('Family Practice', 'Pediatrics', 'General Medicine')) OR
    (c.clinic_name = 'Dental Care Plus' AND s.specialty_name IN ('Dental Care'))
ON CONFLICT (clinic_id, specialty_name) DO NOTHING;

-- Verify the results
SELECT 'After adding test clinics:' as info, COUNT(*) as count FROM clinics WHERE status = 'approved';

-- Show all approved clinics with their specialties
SELECT 
    c.clinic_name,
    c.email,
    c.city,
    c.number_of_doctors,
    c.status,
    STRING_AGG(cs.specialty_name, ', ') as specialties
FROM clinics c
LEFT JOIN clinic_specialties cs ON c.id = cs.clinic_id
WHERE c.status = 'approved'
GROUP BY c.id, c.clinic_name, c.email, c.city, c.number_of_doctors, c.status
ORDER BY c.clinic_name; 