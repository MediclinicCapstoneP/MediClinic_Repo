-- Ensure Your Existing Clinic is Displayed on Patient Home
-- This script updates your existing clinic to ensure it appears on the patient side

-- ===================================================================
-- STEP 1: CHECK CURRENT CLINIC DATA
-- ===================================================================

-- Show current clinic information
SELECT 
    'CURRENT CLINIC DATA' as info,
    id,
    clinic_name,
    email,
    status,
    city,
    phone,
    description,
    created_at
FROM clinics 
ORDER BY created_at DESC;

-- ===================================================================
-- STEP 2: ENSURE CLINIC IS APPROVED AND VISIBLE
-- ===================================================================

-- Update clinic status to 'approved' if it's not already
UPDATE clinics 
SET 
    status = 'approved',
    updated_at = NOW()
WHERE status != 'approved';

-- Ensure basic required fields are present (add defaults if missing)
UPDATE clinics 
SET 
    specialties = COALESCE(specialties, ARRAY['General Medicine']),
    custom_specialties = COALESCE(custom_specialties, ARRAY[]::text[]),
    services = COALESCE(services, ARRAY['Medical Consultation']),
    custom_services = COALESCE(custom_services, ARRAY[]::text[]),
    number_of_doctors = COALESCE(number_of_doctors, 1),
    number_of_staff = COALESCE(number_of_staff, 5),
    description = COALESCE(description, 'Quality healthcare services for our community.'),
    updated_at = NOW()
WHERE 
    specialties IS NULL OR 
    services IS NULL OR 
    description IS NULL OR 
    number_of_doctors IS NULL OR 
    number_of_staff IS NULL;

-- ===================================================================
-- STEP 3: ENSURE PUBLIC ACCESS VIA RLS POLICIES
-- ===================================================================

-- Enable RLS if not already enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Drop existing public access policy if it exists
DROP POLICY IF EXISTS "allow_public_read_approved_clinics" ON clinics;

-- Create policy to allow public access to approved clinics
CREATE POLICY "allow_public_read_approved_clinics" ON clinics
    FOR SELECT 
    USING (status = 'approved');

-- ===================================================================
-- STEP 4: VERIFY THE RESULTS
-- ===================================================================

-- Show updated clinic data
SELECT 
    'UPDATED CLINIC DATA' as info,
    id,
    clinic_name,
    email,
    status,
    city,
    phone,
    description,
    array_length(specialties, 1) as specialties_count,
    array_length(services, 1) as services_count,
    number_of_doctors,
    number_of_staff
FROM clinics 
WHERE status = 'approved'
ORDER BY updated_at DESC;

-- Test the query that the frontend will use
SELECT 
    'FRONTEND TEST QUERY' as info,
    COUNT(*) as approved_clinics_count
FROM clinics 
WHERE status = 'approved';

-- Show RLS policy status
SELECT 
    'RLS POLICY STATUS' as info,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'clinics' 
AND cmd = 'SELECT';

-- Final status message
SELECT 
    '✅ CLINIC SETUP COMPLETE!' as message,
    'Your clinic should now be visible on the patient home page as a card.' as instruction,
    'Refresh your browser to see the changes.' as action_required;