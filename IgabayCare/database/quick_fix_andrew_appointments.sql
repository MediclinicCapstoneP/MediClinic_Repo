-- ===================================================================
-- QUICK FIX FOR ANDREW DOCTOR APPOINTMENTS
-- ===================================================================
-- Based on the debug info, we need to update appointments with doctor_name = 'Andrew'
-- to have the correct doctor_id

-- First, let's see what we have for Andrew
SELECT 
    'Before Fix - Andrew Appointments' as status,
    id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    patient_id
FROM appointments 
WHERE doctor_name = 'Andrew' 
   OR doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128'
ORDER BY appointment_date DESC;

-- Update appointments with doctor_name = 'Andrew' to have the correct doctor_id
UPDATE appointments 
SET doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128',
    updated_at = NOW()
WHERE doctor_name = 'Andrew' 
AND doctor_id IS NULL;

-- Also handle case variations
UPDATE appointments 
SET doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128',
    updated_at = NOW()
WHERE (doctor_name ILIKE '%andrew%' OR doctor_name = 'Dr. Andrew' OR doctor_name = 'Dr.Andrew')
AND doctor_id IS NULL;

-- Fix the Charlie K appointments as well
UPDATE appointments 
SET doctor_id = 'a35516af-53a9-4ed2-9329-bbe2126bb972',
    updated_at = NOW()
WHERE doctor_name = 'Charlie K'
AND doctor_id IS NULL;

-- Verify the results
SELECT 
    'After Fix - Andrew Appointments' as status,
    id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    patient_id
FROM appointments 
WHERE doctor_name = 'Andrew' 
   OR doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128'
ORDER BY appointment_date DESC;

SELECT 
    'After Fix - Charlie K Appointments' as status,
    id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    patient_id
FROM appointments 
WHERE doctor_name = 'Charlie K' 
   OR doctor_id = 'a35516af-53a9-4ed2-9329-bbe2126bb972'
ORDER BY appointment_date DESC;

-- Count total appointments by doctor_id
SELECT 
    'Final Count' as summary,
    doctor_id,
    doctor_name,
    COUNT(*) as appointment_count
FROM appointments
WHERE doctor_id IN ('415503c8-0340-4517-8ae1-7e62d75d5128', 'a35516af-53a9-4ed2-9329-bbe2126bb972')
GROUP BY doctor_id, doctor_name
ORDER BY appointment_count DESC;

RAISE NOTICE '✅ Quick fix for Andrew and Charlie K appointments completed!';
RAISE NOTICE 'Andrew should now see his appointment(s) in the doctor dashboard';
RAISE NOTICE 'Charlie K should see all 3 appointments';