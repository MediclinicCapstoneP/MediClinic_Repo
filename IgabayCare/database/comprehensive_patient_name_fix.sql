-- ===================================================================
-- COMPREHENSIVE PATIENT NAME FIX FOR IGABAY CARE
-- ===================================================================
-- This script comprehensively fixes all patient name display issues
-- across clinic appointments, doctor appointments, and prescription workflows

-- ===================================================================
-- 1. VERIFY CURRENT STATE
-- ===================================================================

-- Check current appointment data
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_records,
    COUNT(patient_name) as with_patient_names,
    COUNT(*) - COUNT(patient_name) as missing_patient_names,
    COUNT(CASE WHEN patient_name ~ '^Patient ID:' THEN 1 END) as with_fallback_names
FROM appointments;

-- Check patients table structure
SELECT 
    'patients' as table_name,
    COUNT(*) as total_records,
    COUNT(first_name) as with_first_name,
    COUNT(last_name) as with_last_name,
    COUNT(full_name) as with_full_name
FROM patients;

-- ===================================================================
-- 2. ADD PATIENT_NAME COLUMN IF MISSING
-- ===================================================================

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
-- 3. COMPREHENSIVE PATIENT NAME UPDATE
-- ===================================================================

-- Update appointments with better patient name resolution
UPDATE appointments 
SET patient_name = COALESCE(
    -- Try patient's full_name first if it exists and is not empty
    NULLIF(TRIM(p.full_name), ''),
    
    -- Then try concatenating first_name and last_name
    CASE 
        WHEN TRIM(COALESCE(p.first_name, '')) != '' AND TRIM(COALESCE(p.last_name, '')) != '' 
        THEN CONCAT(TRIM(p.first_name), ' ', TRIM(p.last_name))
        ELSE NULL
    END,
    
    -- Then try just first_name if available
    NULLIF(TRIM(p.first_name), ''),
    
    -- Then try just last_name if available  
    NULLIF(TRIM(p.last_name), ''),
    
    -- Final fallback to email local part if available
    CASE 
        WHEN p.email IS NOT NULL 
        THEN CONCAT('User (', SPLIT_PART(p.email, '@', 1), ')')
        ELSE NULL
    END,
    
    -- Ultimate fallback
    'Unknown Patient'
)
FROM patients p
WHERE appointments.patient_id = p.id 
AND (
    appointments.patient_name IS NULL 
    OR appointments.patient_name = ''
    OR appointments.patient_name = 'null'
    OR appointments.patient_name = 'undefined'
    OR appointments.patient_name LIKE 'Patient ID:%'
);

-- ===================================================================
-- 4. CREATE ENHANCED TRIGGER FUNCTIONS
-- ===================================================================

-- Enhanced function to populate patient name with better logic
CREATE OR REPLACE FUNCTION populate_patient_name()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
BEGIN
    -- Only populate if patient_name is not already set properly
    IF NEW.patient_name IS NULL 
       OR NEW.patient_name = '' 
       OR NEW.patient_name LIKE 'Patient ID:%'
       OR NEW.patient_name = 'Unknown Patient'
    THEN
        -- Get patient details
        SELECT 
            full_name,
            first_name,
            last_name,
            email
        INTO patient_record
        FROM patients 
        WHERE id = NEW.patient_id;
        
        IF FOUND THEN
            NEW.patient_name := COALESCE(
                -- Try full_name first
                NULLIF(TRIM(patient_record.full_name), ''),
                
                -- Then try first_name + last_name
                CASE 
                    WHEN TRIM(COALESCE(patient_record.first_name, '')) != '' 
                         AND TRIM(COALESCE(patient_record.last_name, '')) != '' 
                    THEN CONCAT(TRIM(patient_record.first_name), ' ', TRIM(patient_record.last_name))
                    ELSE NULL
                END,
                
                -- Then try just first_name
                NULLIF(TRIM(patient_record.first_name), ''),
                
                -- Then try just last_name
                NULLIF(TRIM(patient_record.last_name), ''),
                
                -- Then try email local part
                CASE 
                    WHEN patient_record.email IS NOT NULL 
                    THEN CONCAT('User (', SPLIT_PART(patient_record.email, '@', 1), ')')
                    ELSE NULL
                END,
                
                -- Ultimate fallback
                'Unknown Patient'
            );
        ELSE
            NEW.patient_name := 'Unknown Patient';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 5. CREATE/RECREATE TRIGGERS
-- ===================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_populate_patient_name ON appointments;
DROP TRIGGER IF EXISTS trigger_update_patient_name ON appointments;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_populate_patient_name
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_patient_name();

-- Create trigger for UPDATE operations
CREATE TRIGGER trigger_update_patient_name
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.patient_id IS DISTINCT FROM NEW.patient_id 
          OR NEW.patient_name IS NULL 
          OR NEW.patient_name = ''
          OR NEW.patient_name LIKE 'Patient ID:%')
    EXECUTE FUNCTION populate_patient_name();

-- ===================================================================
-- 6. FIX PATIENTS TABLE DATA QUALITY
-- ===================================================================

-- Update patients table to have full_name populated
UPDATE patients 
SET full_name = CONCAT(TRIM(first_name), ' ', TRIM(last_name))
WHERE full_name IS NULL 
  AND first_name IS NOT NULL 
  AND last_name IS NOT NULL
  AND TRIM(first_name) != '' 
  AND TRIM(last_name) != '';

-- Update patients with only first name
UPDATE patients 
SET full_name = TRIM(first_name)
WHERE full_name IS NULL 
  AND first_name IS NOT NULL 
  AND TRIM(first_name) != ''
  AND (last_name IS NULL OR TRIM(last_name) = '');

-- Update patients with only last name  
UPDATE patients 
SET full_name = TRIM(last_name)
WHERE full_name IS NULL 
  AND last_name IS NOT NULL 
  AND TRIM(last_name) != ''
  AND (first_name IS NULL OR TRIM(first_name) = '');

-- ===================================================================
-- 7. CREATE HELPFUL VIEWS
-- ===================================================================

-- Create a comprehensive view for appointments with patient details
CREATE OR REPLACE VIEW appointments_with_patient_details AS
SELECT 
    a.*,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.full_name as patient_full_name,
    p.email as patient_email,
    p.phone as patient_phone,
    p.date_of_birth as patient_dob,
    c.clinic_name,
    c.address as clinic_address,
    c.city as clinic_city,
    c.state as clinic_state,
    c.phone as clinic_phone,
    d.full_name as doctor_full_name,
    d.specialization as doctor_specialization,
    d.email as doctor_email
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN doctors d ON a.doctor_id = d.id;

-- Grant appropriate permissions
GRANT SELECT ON appointments_with_patient_details TO authenticated;

-- ===================================================================
-- 8. PERFORMANCE INDEXES
-- ===================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_name 
ON appointments(patient_name) WHERE patient_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id_date 
ON appointments(patient_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id_date 
ON appointments(doctor_id, appointment_date) WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id_date 
ON appointments(clinic_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_patients_names 
ON patients(first_name, last_name, full_name);

-- ===================================================================
-- 9. VERIFICATION AND REPORTING
-- ===================================================================

DO $$
DECLARE
    total_appointments INTEGER;
    named_appointments INTEGER;
    fallback_appointments INTEGER;
    total_patients INTEGER;
    named_patients INTEGER;
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'PATIENT NAME FIX VERIFICATION REPORT';
    RAISE NOTICE '===============================================';

    -- Check appointments
    SELECT COUNT(*) INTO total_appointments FROM appointments;
    SELECT COUNT(*) INTO named_appointments 
    FROM appointments 
    WHERE patient_name IS NOT NULL AND patient_name != '' AND patient_name != 'Unknown Patient';
    SELECT COUNT(*) INTO fallback_appointments 
    FROM appointments 
    WHERE patient_name = 'Unknown Patient';
    
    -- Check patients  
    SELECT COUNT(*) INTO total_patients FROM patients;
    SELECT COUNT(*) INTO named_patients 
    FROM patients 
    WHERE full_name IS NOT NULL AND full_name != '';
    
    RAISE NOTICE 'Appointments: % total, % with names, % with fallback names', 
        total_appointments, named_appointments, fallback_appointments;
    RAISE NOTICE 'Patients: % total, % with full names', 
        total_patients, named_patients;
    
    IF named_appointments >= total_appointments * 0.9 THEN
        RAISE NOTICE '✅ SUCCESS: Patient names successfully populated!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Some appointments still missing patient names';
    END IF;

    RAISE NOTICE '✅ Comprehensive patient name fix completed!';
    RAISE NOTICE 'You can now use the appointments_with_patient_details view for enhanced queries';
    RAISE NOTICE 'Triggers are in place to automatically populate patient names for new appointments';
END $$;

-- Show sample of fixed appointments
SELECT 
    'Sample Fixed Appointments' as report_section,
    a.id,
    a.patient_name,
    a.appointment_date,
    a.appointment_time,
    a.status,
    p.first_name,
    p.last_name,
    p.full_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.patient_name IS NOT NULL 
ORDER BY a.created_at DESC
LIMIT 5;

-- Show any remaining problematic appointments
SELECT 
    'Remaining Problem Appointments' as report_section,
    a.id,
    a.patient_id,
    a.patient_name,
    p.first_name,
    p.last_name,
    p.email,
    'Missing patient data' as issue
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.patient_name IS NULL 
   OR a.patient_name = '' 
   OR a.patient_name = 'Unknown Patient'
ORDER BY a.created_at DESC
LIMIT 10;


RAISE NOTICE '✅ Comprehensive patient name fix completed!';
RAISE NOTICE 'You can now use the appointments_with_patient_details view for enhanced queries';
RAISE NOTICE 'Triggers are in place to automatically populate patient names for new appointments';