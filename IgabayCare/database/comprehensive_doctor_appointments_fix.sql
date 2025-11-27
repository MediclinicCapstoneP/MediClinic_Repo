-- ========================================
-- COMPREHENSIVE DOCTOR APPOINTMENTS FIX
-- ========================================
-- This script addresses the core issue where doctor appointments are not showing
-- because doctor_id is NULL while doctor_name is populated.

-- Step 1: Analyze current data state
SELECT 'Current Appointments Data Analysis' as analysis_step;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_id) as appointments_with_doctor_id,
    COUNT(doctor_name) as appointments_with_doctor_name,
    COUNT(*) - COUNT(doctor_id) as appointments_missing_doctor_id,
    COUNT(CASE WHEN doctor_id IS NOT NULL AND doctor_name IS NOT NULL THEN 1 END) as appointments_with_both
FROM appointments;

-- Step 2: Show appointments that have doctor_name but no doctor_id
SELECT 'Appointments with doctor_name but no doctor_id' as issue_type;
SELECT 
    id,
    doctor_name,
    doctor_id,
    patient_name,
    appointment_date,
    appointment_time,
    status
FROM appointments 
WHERE doctor_name IS NOT NULL 
AND doctor_id IS NULL
ORDER BY appointment_date DESC
LIMIT 10;

-- Step 3: Show all doctors in the system
SELECT 'All Doctors in System' as analysis_step;
SELECT 
    id,
    full_name,
    email,
    specialization,
    status
FROM doctors
ORDER BY full_name;

-- Step 4: Fix appointments by matching doctor_name to doctor records
UPDATE appointments 
SET doctor_id = doctors.id,
    updated_at = NOW()
FROM doctors 
WHERE appointments.doctor_name IS NOT NULL 
AND appointments.doctor_id IS NULL 
AND (
    -- Exact match
    LOWER(TRIM(appointments.doctor_name)) = LOWER(TRIM(doctors.full_name))
    OR 
    -- Match without "Dr." prefix
    LOWER(TRIM(REPLACE(appointments.doctor_name, 'dr.', ''))) = LOWER(TRIM(doctors.full_name))
    OR
    LOWER(TRIM(appointments.doctor_name)) = LOWER(TRIM(CONCAT('dr. ', doctors.full_name)))
    OR
    -- Partial match for cases like "Andrew" matching "Dr. Andrew Smith"
    LOWER(TRIM(appointments.doctor_name)) LIKE LOWER(TRIM(CONCAT('%', doctors.full_name, '%')))
    OR
    LOWER(TRIM(doctors.full_name)) LIKE LOWER(TRIM(CONCAT('%', appointments.doctor_name, '%')))
);

-- Step 5: For any remaining unmatched appointments, try fuzzy matching
-- First, let's see what's left unmatched
SELECT 'Remaining Unmatched Appointments' as analysis_step;
SELECT 
    COUNT(*) as still_unmatched_count,
    array_agg(DISTINCT doctor_name) as unmatched_doctor_names
FROM appointments 
WHERE doctor_name IS NOT NULL 
AND doctor_id IS NULL;

-- Step 6: Create a function to resolve doctor_id from doctor_name
CREATE OR REPLACE FUNCTION resolve_doctor_id_from_name(input_doctor_name TEXT)
RETURNS UUID AS $$
DECLARE
    found_doctor_id UUID;
    normalized_input TEXT;
BEGIN
    -- Return NULL if input is NULL or empty
    IF input_doctor_name IS NULL OR TRIM(input_doctor_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Normalize the input
    normalized_input := LOWER(TRIM(input_doctor_name));
    
    -- Try exact match first
    SELECT id INTO found_doctor_id
    FROM doctors 
    WHERE LOWER(TRIM(full_name)) = normalized_input
    LIMIT 1;
    
    IF found_doctor_id IS NOT NULL THEN
        RETURN found_doctor_id;
    END IF;
    
    -- Try without "Dr." prefix
    SELECT id INTO found_doctor_id
    FROM doctors 
    WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(REPLACE(normalized_input, 'dr.', '')))
       OR LOWER(TRIM(CONCAT('dr. ', full_name))) = normalized_input
    LIMIT 1;
    
    IF found_doctor_id IS NOT NULL THEN
        RETURN found_doctor_id;
    END IF;
    
    -- Try partial match (first name only, etc.)
    SELECT id INTO found_doctor_id
    FROM doctors 
    WHERE LOWER(TRIM(full_name)) LIKE CONCAT('%', normalized_input, '%')
       OR normalized_input LIKE CONCAT('%', LOWER(TRIM(full_name)), '%')
    LIMIT 1;
    
    RETURN found_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Use the function to fix any remaining appointments
UPDATE appointments 
SET doctor_id = resolve_doctor_id_from_name(doctor_name),
    updated_at = NOW()
WHERE doctor_name IS NOT NULL 
AND doctor_id IS NULL;

-- Step 8: Create trigger to auto-populate doctor_id when doctor_name is provided
CREATE OR REPLACE FUNCTION auto_populate_doctor_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If doctor_id is not provided but doctor_name is, try to resolve it
    IF NEW.doctor_id IS NULL AND NEW.doctor_name IS NOT NULL THEN
        NEW.doctor_id := resolve_doctor_id_from_name(NEW.doctor_name);
    END IF;
    
    -- If doctor_id is provided but doctor_name is not, populate doctor_name
    IF NEW.doctor_id IS NOT NULL AND (NEW.doctor_name IS NULL OR NEW.doctor_name = '') THEN
        SELECT full_name INTO NEW.doctor_name
        FROM doctors 
        WHERE id = NEW.doctor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_populate_doctor_id ON appointments;

-- Create the trigger for INSERT and UPDATE
CREATE TRIGGER trigger_auto_populate_doctor_id
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_doctor_id();

-- Step 9: Create indexes to optimize doctor appointment queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id_date_time 
    ON appointments(doctor_id, appointment_date, appointment_time) 
    WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_name_date 
    ON appointments(doctor_name, appointment_date) 
    WHERE doctor_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id_status 
    ON appointments(doctor_id, status) 
    WHERE doctor_id IS NOT NULL;

-- Step 10: Create a view for easy doctor appointment queries
CREATE OR REPLACE VIEW doctor_appointments_view AS
SELECT 
    a.*,
    d.full_name as resolved_doctor_name,
    d.specialization as doctor_specialty,
    d.email as doctor_email,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    COALESCE(
        a.patient_name,
        CONCAT(p.first_name, ' ', p.last_name),
        CONCAT('Patient ID: ', SUBSTRING(a.patient_id::text, 1, 8))
    ) as resolved_patient_name,
    c.clinic_name,
    c.address as clinic_address
FROM appointments a
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id;

-- Step 11: Analyze results after fixes
SELECT 'Post-Fix Analysis' as analysis_step;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_id) as appointments_with_doctor_id,
    COUNT(doctor_name) as appointments_with_doctor_name,
    COUNT(*) - COUNT(doctor_id) as still_missing_doctor_id,
    COUNT(CASE WHEN doctor_id IS NOT NULL AND doctor_name IS NOT NULL THEN 1 END) as appointments_with_both
FROM appointments;

-- Step 12: Show sample of fixed appointments
SELECT 'Sample Fixed Appointments' as analysis_step;
SELECT 
    id,
    doctor_name,
    doctor_id,
    resolved_patient_name,
    appointment_date,
    status
FROM doctor_appointments_view 
WHERE doctor_id IS NOT NULL
ORDER BY appointment_date DESC
LIMIT 10;

-- Step 13: Test queries for specific doctor lookups
-- Replace 'Andrew' with the actual doctor name you're looking for
SELECT 'Test Query: Appointments for doctor containing "Andrew"' as test_type;
SELECT 
    id,
    doctor_name,
    resolved_doctor_name,
    resolved_patient_name,
    appointment_date,
    appointment_time,
    status
FROM doctor_appointments_view
WHERE LOWER(resolved_doctor_name) LIKE '%andrew%' 
   OR LOWER(doctor_name) LIKE '%andrew%'
ORDER BY appointment_date DESC;

-- Step 14: Create a stored procedure for getting doctor appointments
CREATE OR REPLACE FUNCTION get_doctor_appointments(
    input_doctor_id UUID,
    filter_status TEXT DEFAULT NULL,
    filter_date DATE DEFAULT NULL,
    limit_results INTEGER DEFAULT NULL
)
RETURNS TABLE(
    appointment_id UUID,
    patient_id UUID,
    patient_name TEXT,
    appointment_date DATE,
    appointment_time TIME,
    appointment_type TEXT,
    status TEXT,
    notes TEXT,
    doctor_notes TEXT,
    clinic_id UUID,
    clinic_name TEXT,
    duration_minutes INTEGER,
    payment_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as appointment_id,
        a.patient_id,
        COALESCE(
            a.patient_name,
            CONCAT(p.first_name, ' ', p.last_name),
            CONCAT('Patient ID: ', SUBSTRING(a.patient_id::text, 1, 8)),
            'Unknown Patient'
        ) as patient_name,
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.status,
        a.notes,
        a.doctor_notes,
        a.clinic_id,
        c.clinic_name,
        a.duration_minutes,
        a.payment_amount
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN clinics c ON a.clinic_id = c.id
    WHERE a.doctor_id = input_doctor_id
    AND (filter_status IS NULL OR a.status = filter_status)
    AND (filter_date IS NULL OR a.appointment_date = filter_date)
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
    LIMIT COALESCE(limit_results, 1000);
END;
$$ LANGUAGE plpgsql;

-- Step 15: Final verification
SELECT 'Final Verification' as verification_step;
SELECT 
    d.full_name as doctor_name,
    COUNT(a.id) as appointment_count,
    COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as scheduled_count,
    COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.id, d.full_name
ORDER BY appointment_count DESC;

-- ========================================
-- SCRIPT COMPLETE
-- ========================================
-- This script should resolve the doctor appointment visibility issues by:
-- 1. Populating missing doctor_id values by matching doctor_name to doctor records
-- 2. Creating triggers to auto-populate doctor_id/doctor_name in future
-- 3. Adding indexes for optimal query performance
-- 4. Creating a view and stored procedure for easier data access
-- 5. Providing verification queries to confirm the fixes work
-- ========================================