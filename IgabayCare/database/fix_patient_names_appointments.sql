-- ===================================================================
-- FIX PATIENT NAMES IN APPOINTMENTS TABLE - IGABACARE
-- ===================================================================
-- This script ensures patient names are properly displayed in doctor appointments

-- ===================================================================
-- 1. ADD PATIENT_NAME COLUMN IF IT DOESN't EXIST
-- ===================================================================

-- Check and add patient_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'patient_name'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN patient_name TEXT;
        
        RAISE NOTICE '✅ Added patient_name column to appointments table';
    ELSE
        RAISE NOTICE '✅ patient_name column already exists in appointments table';
    END IF;
END $$;

-- ===================================================================
-- 2. UPDATE ALL APPOINTMENTS TO INCLUDE PATIENT NAMES
-- ===================================================================

-- Update appointments where patient_name is null or empty
UPDATE appointments 
SET patient_name = CONCAT(p.first_name, ' ', p.last_name)
FROM patients p
WHERE appointments.patient_id = p.id 
AND (
    appointments.patient_name IS NULL 
    OR appointments.patient_name = ''
    OR appointments.patient_name = 'null'
    OR appointments.patient_name = 'undefined'
);

-- Check how many appointments were updated
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_name) as appointments_with_names,
    COUNT(*) - COUNT(patient_name) as appointments_without_names
FROM appointments;

-- ===================================================================
-- 3. CREATE TRIGGER TO AUTO-POPULATE PATIENT_NAME FOR NEW APPOINTMENTS
-- ===================================================================

-- Create or replace function to populate patient name
CREATE OR REPLACE FUNCTION populate_patient_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If patient_name is not provided, populate it from patients table
    IF NEW.patient_name IS NULL OR NEW.patient_name = '' THEN
        SELECT CONCAT(first_name, ' ', last_name) 
        INTO NEW.patient_name
        FROM patients 
        WHERE id = NEW.patient_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_populate_patient_name ON appointments;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_populate_patient_name
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_patient_name();

-- Create trigger for UPDATE operations when patient_id changes
CREATE OR REPLACE TRIGGER trigger_update_patient_name
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.patient_id IS DISTINCT FROM NEW.patient_id)
    EXECUTE FUNCTION populate_patient_name();

-- ===================================================================
-- 4. VERIFICATION QUERIES
-- ===================================================================

-- Show appointments with patient names
SELECT 
    a.id,
    a.patient_name,
    a.appointment_date,
    a.appointment_time,
    a.appointment_type,
    a.status,
    a.doctor_name,
    c.clinic_name,
    p.first_name,
    p.last_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC
LIMIT 10;

-- Count appointments by status
SELECT 
    status,
    COUNT(*) as count,
    COUNT(patient_name) as with_patient_names
FROM appointments 
GROUP BY status
ORDER BY count DESC;

-- Show doctor appointments with patient information
SELECT 
    a.doctor_id,
    a.doctor_name,
    COUNT(*) as total_appointments,
    COUNT(patient_name) as appointments_with_patient_names,
    COUNT(*) - COUNT(patient_name) as missing_patient_names
FROM appointments a
WHERE a.doctor_id IS NOT NULL
GROUP BY a.doctor_id, a.doctor_name
ORDER BY total_appointments DESC;

-- ===================================================================
-- 5. TEST DATA VERIFICATION
-- ===================================================================

-- Show a specific appointment (if it exists) with full details
-- This helps verify the fix works for the appointment mentioned in the issue
SELECT 
    a.id as appointment_id,
    a.patient_id,
    a.patient_name,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) as constructed_name,
    a.appointment_date,
    a.appointment_time,
    a.appointment_type,
    a.status,
    a.doctor_id,
    a.doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a'
   OR a.patient_name IS NULL
   OR a.patient_name = ''
ORDER BY a.created_at DESC
LIMIT 5;

-- ===================================================================
-- 6. CREATE INDEX FOR BETTER PERFORMANCE
-- ===================================================================

-- Create index on patient_name for faster searches
CREATE INDEX IF NOT EXISTS idx_appointments_patient_name 
ON appointments(patient_name);

-- Create index on doctor_id for faster doctor appointment queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id 
ON appointments(doctor_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status 
ON appointments(doctor_id, appointment_date, status);

RAISE NOTICE '✅ All patient name fixes and indexes have been applied successfully!';