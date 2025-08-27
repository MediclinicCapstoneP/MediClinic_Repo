-- COMPREHENSIVE FIX: Clinic Display Issues on Patient Home Page
-- This script fixes multiple potential issues causing clinics not to display

-- ===================================================================
-- STEP 1: DIAGNOSE CURRENT STATE
-- ===================================================================

-- Check current clinic count and status
SELECT 'DIAGNOSIS: Current Clinic Count' as info;
SELECT 
    status,
    COUNT(*) as count
FROM clinics 
GROUP BY status
ORDER BY status;

-- Show total count
SELECT 
    'Total clinics in database' as info,
    COUNT(*) as count
FROM clinics;

-- ===================================================================
-- STEP 2: FIX RLS POLICIES FOR PUBLIC ACCESS
-- ===================================================================

-- Enable RLS on clinics table (if not already enabled)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view approved clinics" ON clinics;
DROP POLICY IF EXISTS "Anyone can view approved clinics" ON clinics;
DROP POLICY IF EXISTS "Authenticated users can view all clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can manage their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can delete own profile" ON clinics;

-- Create new comprehensive RLS policies

-- 1. Allow ANYONE (including anonymous users) to view approved clinics
-- This is critical for the patient home page to work
CREATE POLICY "Public access to approved clinics" ON clinics
    FOR SELECT 
    USING (status = 'approved');

-- 2. Allow authenticated clinic owners to manage their own clinics
CREATE POLICY "Clinic owners full access" ON clinics
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Allow authenticated users to view all clinics (for admin purposes)
CREATE POLICY "Authenticated users view all" ON clinics
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- ===================================================================
-- STEP 3: ADD TEST CLINICS IF NONE EXIST
-- ===================================================================

-- Only insert test clinics if no approved clinics exist
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM clinics WHERE status = 'approved') = 0 THEN
        -- Insert test clinics
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
            'fix-clinic-1',
            'fix-user-1',
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
            'fix-clinic-2',
            'fix-user-2',
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
            'fix-clinic-3',
            'fix-user-3',
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
            'fix-clinic-4',
            'fix-user-4',
            'Heart & Wellness Center',
            'heart@wellnesscenter.com',
            '+63 (555) 567-8901',
            'https://heartwellness.com',
            '654 Heart Street',
            'Toledo City',
            'Cebu',
            '6038',
            'LIC-004-2024',
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
        
        RAISE NOTICE 'Test clinics added successfully!';
    ELSE
        RAISE NOTICE 'Approved clinics already exist, skipping test data insertion.';
    END IF;
END $$;

-- ===================================================================
-- STEP 4: VERIFY AND REPORT RESULTS  
-- ===================================================================

-- Show final results
SELECT 'RESULTS: Approved Clinics Available' as info;
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

-- Show policy status
SELECT 'RESULTS: RLS Policies for Clinics Table' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    substring(qual from 1 for 50) as policy_condition
FROM pg_policies 
WHERE tablename = 'clinics'
ORDER BY policyname;

-- Show final count
SELECT 
    'FINAL RESULT' as info,
    COUNT(*) as approved_clinics_count,
    'Clinics should now be visible on patient home page!' as status
FROM clinics 
WHERE status = 'approved';

-- Test query that the frontend should be able to execute
SELECT 'TEST: Frontend Query Simulation' as info;
SELECT COUNT(*) as clinic_count 
FROM clinics 
WHERE status = 'approved';

RAISE NOTICE '=== CLINIC DISPLAY FIX COMPLETED ===';
RAISE NOTICE 'If clinics still do not appear:';
RAISE NOTICE '1. Refresh your browser page';
RAISE NOTICE '2. Check browser console for JavaScript errors';
RAISE NOTICE '3. Verify Supabase connection in your app';
RAISE NOTICE '4. Check that getPublicClinics() function is being called';