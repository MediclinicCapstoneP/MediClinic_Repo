-- ========================================
-- FIX DOCTOR APPOINTMENTS PATIENT DATA ISSUE
-- ========================================
-- This script fixes the issue where patient names and emails
-- are not being populated in the doctor_appointments table

-- ===================================================================
-- 1. DIAGNOSTIC: CHECK CURRENT STATE
-- ===================================================================

-- Check if doctor_appointments table exists and has patient fields
SELECT 'doctor_appointments table structure check' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctor_appointments' 
AND column_name IN ('patient_name', 'patient_email', 'patient_phone')
ORDER BY column_name;

-- Check existing data
SELECT 'Current patient data in doctor_appointments' as check_type;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_name) as has_patient_name,
    COUNT(patient_email) as has_patient_email,
    COUNT(patient_phone) as has_patient_phone,
    COUNT(CASE WHEN patient_name IS NULL OR patient_name = '' THEN 1 END) as missing_name,
    COUNT(CASE WHEN patient_email IS NULL OR patient_email = '' THEN 1 END) as missing_email
FROM doctor_appointments;

-- Show sample records with missing patient data
SELECT 'Sample appointments with missing patient data' as check_type;
SELECT 
    id,
    patient_id,
    patient_name,
    patient_email,
    patient_phone,
    appointment_date,
    status
FROM doctor_appointments 
WHERE patient_name IS NULL OR patient_name = '' OR patient_name = 'Unknown Patient'
LIMIT 5;

-- ===================================================================
-- 2. FIX THE TRIGGER FUNCTION
-- ===================================================================

-- Drop existing function and trigger if they exist
DROP FUNCTION IF EXISTS populate_doctor_appointment_data() CASCADE;
DROP TRIGGER IF EXISTS populate_doctor_appointment_data_trigger ON doctor_appointments;

-- Create the improved trigger function
CREATE OR REPLACE FUNCTION populate_doctor_appointment_data()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    clinic_record RECORD;
BEGIN
    -- Log the trigger execution (for debugging)
    RAISE NOTICE 'Populating doctor appointment data for patient_id: %, clinic_id: %', NEW.patient_id, NEW.clinic_id;
    
    -- Get patient information with better error handling
    IF NEW.patient_id IS NOT NULL THEN
        BEGIN
            SELECT 
                COALESCE(TRIM(first_name), '') || ' ' || COALESCE(TRIM(last_name), '') as full_name,
                email,
                phone
            INTO patient_record
            FROM patients 
            WHERE id = NEW.patient_id;
            
            IF FOUND THEN
                -- Clean up the name and set fields
                NEW.patient_name := TRIM(BOTH ' ' FROM patient_record.full_name);
                NEW.patient_email := patient_record.email;
                NEW.patient_phone := patient_record.phone;
                
                -- If name is empty after concatenation, try using email
                IF NEW.patient_name = '' OR NEW.patient_name = ' ' THEN
                    IF patient_record.email IS NOT NULL AND patient_record.email != '' THEN
                        NEW.patient_name := SPLIT_PART(patient_record.email, '@', 1);
                    ELSE
                        NEW.patient_name := 'Patient ' || SUBSTRING(NEW.patient_id::text, 1, 8);
                    END IF;
                END IF;
                
                RAISE NOTICE 'Patient data populated: name=%, email=%', NEW.patient_name, NEW.patient_email;
            ELSE
                RAISE WARNING 'Patient not found with ID: %', NEW.patient_id;
                NEW.patient_name := 'Patient ' || SUBSTRING(NEW.patient_id::text, 1, 8);
                NEW.patient_email := NULL;
                NEW.patient_phone := NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error fetching patient data: %', SQLERRM;
            NEW.patient_name := 'Error Loading Patient';
            NEW.patient_email := NULL;
            NEW.patient_phone := NULL;
        END;
    ELSE
        NEW.patient_name := 'No Patient ID';
        NEW.patient_email := NULL;
        NEW.patient_phone := NULL;
    END IF;
  
    -- Get clinic information
    IF NEW.clinic_id IS NOT NULL THEN
        BEGIN
            SELECT clinic_name
            INTO clinic_record
            FROM clinics
            WHERE id = NEW.clinic_id;
            
            IF FOUND THEN
                NEW.clinic_name := clinic_record.clinic_name;
                RAISE NOTICE 'Clinic data populated: %', NEW.clinic_name;
            ELSE
                RAISE WARNING 'Clinic not found with ID: %', NEW.clinic_id;
                NEW.clinic_name := 'Unknown Clinic';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error fetching clinic data: %', SQLERRM;
            NEW.clinic_name := 'Error Loading Clinic';
        END;
    ELSE
        NEW.clinic_name := 'No Clinic ID';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 3. CREATE THE TRIGGER
-- ===================================================================

-- Create the trigger for both INSERT and UPDATE
CREATE TRIGGER populate_doctor_appointment_data_trigger
    BEFORE INSERT OR UPDATE ON doctor_appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_doctor_appointment_data();

-- ===================================================================
-- 4. UPDATE EXISTING RECORDS
-- ===================================================================

-- Update all existing records that have missing patient information
UPDATE doctor_appointments 
SET 
    patient_name = TRIM(BOTH ' ' FROM COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')),
    patient_email = p.email,
    patient_phone = p.phone
FROM patients p
WHERE doctor_appointments.patient_id = p.id 
AND (
    doctor_appointments.patient_name IS NULL 
    OR doctor_appointments.patient_name = '' 
    OR doctor_appointments.patient_name = 'Unknown Patient'
    OR doctor_appointments.patient_name = 'Error Loading Patient'
);

-- For any remaining records where patient name is still empty, use email or patient ID
UPDATE doctor_appointments 
SET patient_name = CASE 
    WHEN patient_email IS NOT NULL AND patient_email != '' THEN SPLIT_PART(patient_email, '@', 1)
    ELSE 'Patient ' || SUBSTRING(patient_id::text, 1, 8)
END
WHERE patient_name IS NULL OR patient_name = '' OR patient_name = 'Unknown Patient';

-- Update clinic names for existing records
UPDATE doctor_appointments 
SET clinic_name = c.clinic_name
FROM clinics c
WHERE doctor_appointments.clinic_id = c.id 
AND (
    doctor_appointments.clinic_name IS NULL 
    OR doctor_appointments.clinic_name = '' 
    OR doctor_appointments.clinic_name = 'Unknown Clinic'
);

-- ===================================================================
-- 5. VERIFICATION
-- ===================================================================

-- Check the results
SELECT 'After fix - patient data verification' as check_type;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_name) as has_patient_name,
    COUNT(patient_email) as has_patient_email,
    COUNT(patient_phone) as has_patient_phone,
    COUNT(CASE WHEN patient_name IS NULL OR patient_name = '' THEN 1 END) as still_missing_name
FROM doctor_appointments;

-- Show sample fixed records
SELECT 'Sample fixed appointments' as check_type;
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

-- Test the trigger with a sample insert (commented out - uncomment to test)
/*
-- Test trigger
INSERT INTO doctor_appointments (
    doctor_id,
    appointment_id,
    patient_id,
    clinic_id,
    appointment_date,
    appointment_time,
    appointment_type,
    duration_minutes,
    status,
    payment_amount,
    priority,
    assigned_at,
    payment_status,
    prescription_given
) VALUES (
    'test-doctor-id',
    'test-appointment-id',
    'test-patient-id',
    'test-clinic-id',
    CURRENT_DATE,
    '10:00:00',
    'consultation',
    30,
    'assigned',
    0,
    'normal',
    NOW(),
    'pending',
    false
);

-- Check if trigger worked
SELECT patient_name, patient_email, patient_phone, clinic_name 
FROM doctor_appointments 
WHERE appointment_id = 'test-appointment-id';

-- Clean up test
DELETE FROM doctor_appointments WHERE appointment_id = 'test-appointment-id';
*/

SELECT 'Doctor appointments patient data fix completed successfully!' as status;
