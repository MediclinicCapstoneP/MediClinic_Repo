-- Quick Fix: Add Test Clinics for Patient Home Display
-- Run this in your Supabase SQL Editor to immediately add test clinics

-- First, check current state
SELECT 'Current clinic count:' as info, COUNT(*) as count FROM clinics;

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
    updated_at
) VALUES 
(
    'clinic-test-1',
    'test-user-clinic-1',
    'City Medical Center',
    'info@citymedical.com',
    '+63 (555) 123-4567',
    'https://citymedical.com',
    '123 Main Street',
    'Cebu City',
    'Cebu',
    '6000',
    'LIC-001-2024',
    2018,
    ARRAY['General Medicine', 'Family Practice', 'Internal Medicine'],
    ARRAY['Wellness Consultation', 'Health Screening'],
    ARRAY['Medical Consultation', 'Health Check-up', 'Laboratory Tests'],
    ARRAY['Executive Health Package', 'Corporate Wellness'],
    '{
        "monday": {"open": "08:00", "close": "18:00"},
        "tuesday": {"open": "08:00", "close": "18:00"},
        "wednesday": {"open": "08:00", "close": "18:00"},
        "thursday": {"open": "08:00", "close": "18:00"},
        "friday": {"open": "08:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "16:00"},
        "sunday": {"open": "10:00", "close": "14:00"}
    }'::jsonb,
    5,
    12,
    'A comprehensive medical center providing quality healthcare services with modern equipment and experienced medical professionals.',
    'approved',
    NOW(),
    NOW()
),
(
    'clinic-test-2',
    'test-user-clinic-2',
    'QuickCare Medical Clinic',
    'contact@quickcare.com',
    '+63 (555) 234-5678',
    'https://quickcare.com',
    '456 Health Avenue',
    'Mandaue City',
    'Cebu',
    '6014',
    'LIC-002-2024',
    2020,
    ARRAY['Emergency Medicine', 'Pediatrics', 'General Surgery'],
    ARRAY['24/7 Emergency Care'],
    ARRAY['Emergency Services', 'Pediatric Care', 'Minor Surgery'],
    ARRAY['Walk-in Consultation', 'Emergency Response'],
    '{
        "monday": {"open": "06:00", "close": "22:00"},
        "tuesday": {"open": "06:00", "close": "22:00"},
        "wednesday": {"open": "06:00", "close": "22:00"},
        "thursday": {"open": "06:00", "close": "22:00"},
        "friday": {"open": "06:00", "close": "22:00"},
        "saturday": {"open": "08:00", "close": "20:00"},
        "sunday": {"open": "08:00", "close": "20:00"}
    }'::jsonb,
    8,
    20,
    'Quick and reliable medical care available 6 days a week. Specializing in emergency care and pediatric services.',
    'approved',
    NOW(),
    NOW()
),
(
    'clinic-test-3',
    'test-user-clinic-3',
    'Wellness Family Clinic',
    'care@wellnessfamily.com',
    '+63 (555) 345-6789',
    'https://wellnessfamily.com',
    '789 Wellness Drive',
    'Lapu-Lapu City',
    'Cebu',
    '6015',
    'LIC-003-2024',
    2015,
    ARRAY['Family Medicine', 'Cardiology', 'Dermatology'],
    ARRAY['Family Health Programs'],
    ARRAY['Family Consultation', 'Heart Health', 'Skin Care'],
    ARRAY['Family Health Package', 'Annual Check-up'],
    '{
        "monday": {"open": "08:00", "close": "17:00"},
        "tuesday": {"open": "08:00", "close": "17:00"},
        "wednesday": {"open": "08:00", "close": "17:00"},
        "thursday": {"open": "08:00", "close": "17:00"},
        "friday": {"open": "08:00", "close": "17:00"},
        "saturday": {"open": "09:00", "close": "15:00"},
        "sunday": {"open": "closed", "close": "closed"}
    }'::jsonb,
    4,
    10,
    'Your family''s health partner. Providing comprehensive family medicine with a focus on preventive care and wellness.',
    'approved',
    NOW(),
    NOW()
),
(
    'clinic-test-4',
    'test-user-clinic-4',
    'Advanced Diagnostic Center',
    'info@advanceddiagnostic.com',
    '+63 (555) 456-7890',
    'https://advanceddiagnostic.com',
    '321 Diagnostic Boulevard',
    'Talisay City',
    'Cebu',
    '6045',
    'LIC-004-2024',
    2019,
    ARRAY['Radiology', 'Laboratory Services', 'Pathology'],
    ARRAY['Advanced Imaging', 'Molecular Diagnostics'],
    ARRAY['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Blood Tests'],
    ARRAY['Full Body Scan', 'Health Screening Package'],
    '{
        "monday": {"open": "07:00", "close": "19:00"},
        "tuesday": {"open": "07:00", "close": "19:00"},
        "wednesday": {"open": "07:00", "close": "19:00"},
        "thursday": {"open": "07:00", "close": "19:00"},
        "friday": {"open": "07:00", "close": "19:00"},
        "saturday": {"open": "08:00", "close": "16:00"},
        "sunday": {"open": "08:00", "close": "12:00"}
    }'::jsonb,
    6,
    15,
    'State-of-the-art diagnostic center with advanced imaging technology and comprehensive laboratory services.',
    'approved',
    NOW(),
    NOW()
),
(
    'clinic-test-5',
    'test-user-clinic-5',
    'Heart & Wellness Center',
    'heart@wellnesscenter.com',
    '+63 (555) 567-8901',
    'https://heartwellness.com',
    '654 Heart Street',
    'Toledo City',
    'Cebu',
    '6038',
    'LIC-005-2024',
    2017,
    ARRAY['Cardiology', 'Internal Medicine', 'Endocrinology'],
    ARRAY['Cardiac Rehabilitation', 'Diabetes Management'],
    ARRAY['ECG', 'Echocardiogram', 'Stress Test', 'Diabetes Care'],
    ARRAY['Heart Health Package', 'Diabetes Management Program'],
    '{
        "monday": {"open": "08:00", "close": "17:00"},
        "tuesday": {"open": "08:00", "close": "17:00"},
        "wednesday": {"open": "08:00", "close": "17:00"},
        "thursday": {"open": "08:00", "close": "17:00"},
        "friday": {"open": "08:00", "close": "17:00"},
        "saturday": {"open": "09:00", "close": "14:00"},
        "sunday": {"open": "closed", "close": "closed"}
    }'::jsonb,
    3,
    8,
    'Specialized care for heart health and chronic conditions. Expert cardiologists and modern cardiac facilities.',
    'approved',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the clinics were added
SELECT 
    clinic_name,
    city,
    status,
    array_length(specialties, 1) as specialties_count,
    number_of_doctors,
    created_at
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Show final count
SELECT 'Total approved clinics:' as result, COUNT(*) as count 
FROM clinics 
WHERE status = 'approved';