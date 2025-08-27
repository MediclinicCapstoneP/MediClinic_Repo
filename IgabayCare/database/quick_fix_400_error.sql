-- QUICK FIX: Resolve 400 Bad Request Error for Clinic Display
-- This script addresses the root causes behind the Supabase 400 error

-- ===================================================================
-- STEP 1: ENSURE TABLE EXISTS AND RLS IS CONFIGURED
-- ===================================================================

-- Check if clinics table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinics') THEN
        RAISE EXCEPTION 'Clinics table does not exist! Please run the main schema.sql first.';
    END IF;
    RAISE NOTICE '✅ Clinics table exists';
END $$;

-- Enable RLS if not already enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- STEP 2: FIX RLS POLICIES FOR PUBLIC ACCESS
-- ===================================================================

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Public can view approved clinics" ON clinics;
DROP POLICY IF EXISTS "Public access to approved clinics" ON clinics;
DROP POLICY IF EXISTS "Anyone can view approved clinics" ON clinics;

-- Create a simple, working policy for public access
CREATE POLICY "allow_public_read_approved_clinics" ON clinics
    FOR SELECT 
    USING (status = 'approved');

-- Verify policy was created
SELECT 'Policy created successfully' as status 
WHERE EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clinics' 
    AND policyname = 'allow_public_read_approved_clinics'
);

-- ===================================================================
-- STEP 3: ADD TEST DATA IF NO APPROVED CLINICS EXIST
-- ===================================================================

-- Check current state and add test clinics if needed
DO $$
DECLARE
    clinic_count INTEGER;
BEGIN
    -- Count approved clinics
    SELECT COUNT(*) INTO clinic_count FROM clinics WHERE status = 'approved';
    
    IF clinic_count = 0 THEN
        RAISE NOTICE 'No approved clinics found. Adding test clinics...';
        
        -- Insert test clinics
        INSERT INTO clinics (
            id, user_id, clinic_name, email, phone, address, city, state, zip_code,
            description, status, specialties, services, number_of_doctors, number_of_staff,
            created_at, updated_at
        ) VALUES 
        (
            'test-clinic-quick-1',
            'test-user-quick-1', 
            'Metro Health Center',
            'info@metrohealth.com',
            '+63 123 456 7890',
            '123 Health Street',
            'Cebu City',
            'Cebu',
            '6000',
            'Your trusted healthcare partner providing comprehensive medical services.',
            'approved',
            ARRAY['General Medicine', 'Family Practice'],
            ARRAY['Medical Consultation', 'Health Check-up'],
            3,
            8,
            NOW(),
            NOW()
        ),
        (
            'test-clinic-quick-2',
            'test-user-quick-2',
            'Care Plus Clinic', 
            'contact@careplus.com',
            '+63 123 456 7891',
            '456 Medical Ave',
            'Mandaue City', 
            'Cebu',
            '6014',
            'Quality healthcare services with modern facilities and experienced staff.',
            'approved',
            ARRAY['Emergency Medicine', 'Pediatrics'],
            ARRAY['Emergency Care', 'Child Care'],
            5,
            12,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Added 2 test clinics successfully';
    ELSE
        RAISE NOTICE '✅ Found % approved clinics already exist', clinic_count;
    END IF;
END $$;

-- ===================================================================
-- STEP 4: VERIFY THE FIX
-- ===================================================================

-- Show results
SELECT 
    'VERIFICATION RESULTS' as info,
    COUNT(*) as approved_clinics
FROM clinics 
WHERE status = 'approved';

-- Test the query that should work now
SELECT 
    'TEST QUERY RESULTS' as info,
    clinic_name,
    city,
    status
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 3;

-- Show RLS policy status
SELECT 
    'RLS POLICY STATUS' as info,
    policyname,
    permissive
FROM pg_policies 
WHERE tablename = 'clinics' 
AND cmd = 'SELECT';

-- Final success message
SELECT 
    '🎉 FIX COMPLETED SUCCESSFULLY! 🎉' as message,
    'The 400 error should now be resolved. Refresh your patient home page.' as instruction;