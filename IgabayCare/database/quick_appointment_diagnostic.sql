-- Quick Appointment Diagnostic
-- This will help us understand why appointments aren't accessible

-- 1. Check if the specific appointment exists
SELECT 'Checking specific appointment:' as test;
SELECT id, doctor_id, doctor_name, patient_id, patient_name, status 
FROM appointments 
WHERE id = 'd95262ea-5375-4cfb-876e-0e0147c7ec6b';

-- 2. Check all appointments in the system
SELECT 'All appointments count:' as test;
SELECT COUNT(*) as total_appointments FROM appointments;

-- 3. Check appointments by doctor_name Andrew
SELECT 'Appointments for doctor_name Andrew:' as test;
SELECT id, doctor_id, doctor_name, patient_id, patient_name, status 
FROM appointments 
WHERE doctor_name = 'Andrew';

-- 4. Check appointments by doctor_id
SELECT 'Appointments for doctor_id 415503c8-0340-4517-8ae1-7e62d75d5128:' as test;
SELECT id, doctor_id, doctor_name, patient_id, patient_name, status 
FROM appointments 
WHERE doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128';

-- 5. Check if RLS is enabled on appointments
SELECT 'RLS status on appointments:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointments';

-- 6. Check RLS policies
SELECT 'RLS policies on appointments:' as test;
SELECT * FROM pg_policies WHERE tablename = 'appointments';

-- 7. Check current role/user
SELECT 'Current database user:' as test;
SELECT current_user, current_role;

-- 8. Try to fix the appointment if it exists but doctor_id is wrong
UPDATE appointments 
SET doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128',
    updated_at = NOW()
WHERE id = 'd95262ea-5375-4cfb-876e-0e0147c7ec6b'
AND (doctor_id IS NULL OR doctor_id != '415503c8-0340-4517-8ae1-7e62d75d5128');

-- 9. Final verification
SELECT 'After fix - appointment check:' as test;
SELECT id, doctor_id, doctor_name, patient_id, patient_name, status 
FROM appointments 
WHERE id = 'd95262ea-5375-4cfb-876e-0e0147c7ec6b';

-- 10. Check if appointment now appears for doctor
SELECT 'Final doctor appointments:' as test;
SELECT id, doctor_id, doctor_name, patient_id, patient_name, status 
FROM appointments 
WHERE doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128';