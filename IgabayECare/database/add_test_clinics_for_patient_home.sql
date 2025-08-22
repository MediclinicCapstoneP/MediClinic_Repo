-- Add test clinics for Patient Home page display
-- These clinics will be approved and visible to patients

-- First, let's add some test users for the clinics
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('clinic-user-1', 'oasis@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('clinic-user-2', 'bogo@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('clinic-user-3', 'verdid@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('clinic-user-4', 'mayol@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Add test clinics
INSERT INTO public.clinics (
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
    'clinic-1',
    'clinic-user-1',
    'OASIS DIAGNOSTIC & LABORATORY CENTER',
    'oasis@test.com',
    '+63 (555) 123-4567',
    'www.oasisdiagnostic.com',
    '123 Main Street',
    'Bogo City',
    'Cebu',
    '6010',
    'LIC-001',
    2015,
    8,
    15,
    'Comprehensive diagnostic and laboratory services with modern equipment.',
    'approved',
    now(),
    now()
  ),
  (
    'clinic-2',
    'clinic-user-2',
    'Bogo Clinical Laboratory',
    'bogo@test.com',
    '+63 (555) 234-5678',
    'www.bogoclinical.com',
    '456 Oak Avenue',
    'Bogo City',
    'Cebu',
    '6010',
    'LIC-002',
    2018,
    5,
    12,
    'Professional clinical laboratory services for accurate medical testing.',
    'approved',
    now(),
    now()
  ),
  (
    'clinic-3',
    'clinic-user-3',
    'Verdida Optical Clinic',
    'verdid@test.com',
    '+63 (555) 345-6789',
    'www.verdidoptical.com',
    '789 Health Boulevard',
    'Bogo City',
    'Cebu',
    '6010',
    'LIC-003',
    2020,
    3,
    8,
    'Professional optical services for vision care and eyewear.',
    'approved',
    now(),
    now()
  ),
  (
    'clinic-4',
    'clinic-user-4',
    'Mayol Dental Clinic',
    'mayol@test.com',
    '+63 (555) 456-7890',
    'www.mayoldental.com',
    '321 Medical Center Drive',
    'Bogo City',
    'Cebu',
    '6010',
    'LIC-004',
    2012,
    6,
    10,
    'Comprehensive dental care services for all ages.',
    'approved',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Add specialties for the clinics
INSERT INTO public.clinic_specialties (
  clinic_id,
  specialty_name,
  is_custom,
  created_at
) VALUES 
  -- OASIS DIAGNOSTIC
  ('clinic-1', 'Laboratory Services', false, now()),
  ('clinic-1', 'Diagnostic Tests', false, now()),
  ('clinic-1', 'Blood Tests', false, now()),
  ('clinic-1', 'X-Ray Services', true, now()),
  ('clinic-1', 'ECG Services', true, now()),
  
  -- Bogo Clinical Laboratory
  ('clinic-2', 'Clinical Laboratory', false, now()),
  ('clinic-2', 'Medical Tests', false, now()),
  ('clinic-2', 'Health Screening', false, now()),
  ('clinic-2', 'Complete Blood Count', true, now()),
  ('clinic-2', 'Chemistry Tests', true, now()),
  
  -- Verdida Optical Clinic
  ('clinic-3', 'Optical Services', false, now()),
  ('clinic-3', 'Eye Care', false, now()),
  ('clinic-3', 'Vision Correction', false, now()),
  ('clinic-3', 'Contact Lens Fitting', true, now()),
  ('clinic-3', 'Eyeglass Prescription', true, now()),
  
  -- Mayol Dental Clinic
  ('clinic-4', 'Dental Care', false, now()),
  ('clinic-4', 'Oral Surgery', false, now()),
  ('clinic-4', 'Orthodontics', false, now()),
  ('clinic-4', 'Dental Implants', true, now()),
  ('clinic-4', 'Root Canal Treatment', true, now())
ON CONFLICT (clinic_id, specialty_name) DO NOTHING;

-- Verify the data was inserted
SELECT 
  c.clinic_name,
  c.status,
  c.city,
  c.number_of_doctors,
  COUNT(cs.specialty_name) as specialty_count
FROM public.clinics c
LEFT JOIN public.clinic_specialties cs ON c.id = cs.clinic_id
WHERE c.status = 'approved'
GROUP BY c.id, c.clinic_name, c.status, c.city, c.number_of_doctors
ORDER BY c.created_at DESC; 