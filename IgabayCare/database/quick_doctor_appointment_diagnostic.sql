-- QUICK DOCTOR APPOINTMENT PATIENT DATA DIAGNOSTIC
-- Run this to check if patient data is populated correctly

-- Check doctor_appointments table structure
SELECT 'DOCTOR_APPOINTMENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctor_appointments' 
AND column_name IN ('patient_name', 'patient_email', 'patient_phone', 'clinic_name')
ORDER BY column_name;

-- Check current data state
SELECT '';
SELECT 'CURRENT PATIENT DATA STATE:' as info;
SELECT 
    COUNT(*) as total_doctor_appointments,
    COUNT(patient_name) as has_patient_name,
    COUNT(patient_email) as has_patient_email,
    COUNT(patient_phone) as has_patient_phone,
    COUNT(CASE WHEN patient_name IS NULL OR patient_name = '' THEN 1 END) as missing_name,
    COUNT(CASE WHEN patient_email IS NULL OR patient_email = '' THEN 1 END) as missing_email
FROM doctor_appointments;

-- Show sample records
SELECT '';
SELECT 'SAMPLE RECORDS (first 5):' as info;
SELECT 
    id,
    patient_id,
    patient_name,
    patient_email,
    patient_phone,
    clinic_name,
    appointment_date,
    status
FROM doctor_appointments 
ORDER BY created_at DESC
LIMIT 5;

-- Check if trigger exists
SELECT '';
SELECT 'TRIGGER STATUS:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'doctor_appointments'
AND trigger_name = 'populate_doctor_appointment_data_trigger';
