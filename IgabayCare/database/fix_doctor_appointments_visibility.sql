-- ===================================================================
-- FIX DOCTOR APPOINTMENTS VISIBILITY - IGABAY CARE
-- ===================================================================
-- This script fixes the issue where doctor appointments don't show up
-- because doctor_id is null even when doctor_name is set

-- ===================================================================
-- 1. ANALYZE CURRENT STATE
-- ===================================================================

-- Check current appointments with doctor assignments
SELECT 
    'Current Doctor Appointment Status' as analysis,
    COUNT(*) as total_appointments,
    COUNT(doctor_id) as with_doctor_id,
    COUNT(doctor_name) as with_doctor_name,
    COUNT(*) - COUNT(doctor_id) as missing_doctor_id,
    COUNT(CASE WHEN doctor_id IS NOT NULL AND doctor_name IS NOT NULL THEN 1 END) as complete_doctor_info
FROM appointments;

-- Show appointments with doctor_name but no doctor_id
SELECT 
    'Appointments with doctor_name but missing doctor_id' as issue_type,
    id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    patient_id
FROM appointments 
WHERE doctor_name IS NOT NULL 
AND doctor_id IS NULL
ORDER BY appointment_date DESC;

-- ===================================================================
-- 2. ATTEMPT TO RESOLVE DOCTOR_IDS FROM DOCTOR_NAMES
-- ===================================================================

-- Try to match doctor names to doctor IDs from the doctors table
-- This will help us see what we can automatically resolve
SELECT 
    'Doctor Name Matching Analysis' as analysis_type,
    a.doctor_name,
    COUNT(*) as appointment_count,
    d.id as possible_doctor_id,
    d.full_name as doctor_full_name
FROM appointments a
LEFT JOIN doctors d ON (
    LOWER(a.doctor_name) = LOWER(d.full_name) 
    OR LOWER(a.doctor_name) = LOWER(SPLIT_PART(d.full_name, ' ', 1))
    OR a.doctor_name ILIKE '%' || SPLIT_PART(d.full_name, ' ', 1) || '%'
)
WHERE a.doctor_name IS NOT NULL 
AND a.doctor_id IS NULL
GROUP BY a.doctor_name, d.id, d.full_name
ORDER BY a.doctor_name, appointment_count DESC;

-- ===================================================================
-- 3. UPDATE APPOINTMENTS WITH MATCHED DOCTOR IDS
-- ===================================================================

-- Update appointments where we can match doctor names to doctor IDs
UPDATE appointments 
SET doctor_id = d.id,
    updated_at = NOW()
FROM doctors d
WHERE appointments.doctor_name IS NOT NULL 
AND appointments.doctor_id IS NULL
AND (
    LOWER(appointments.doctor_name) = LOWER(d.full_name)
    OR LOWER(appointments.doctor_name) = LOWER(CONCAT(d.first_name, ' ', d.last_name))
    OR appointments.doctor_name ILIKE '%' || d.first_name || '%'
);

-- ===================================================================
-- 4. MANUAL FIXES FOR SPECIFIC CASES
-- ===================================================================

-- Based on your data, let's fix specific doctor name matches
-- You may need to adjust these based on your actual doctors table

-- Fix "Dr.keven" appointments (assuming there's a Kevin doctor)
UPDATE appointments 
SET doctor_id = (
    SELECT id FROM doctors 
    WHERE LOWER(full_name) LIKE '%kevin%' 
    OR LOWER(first_name) = 'kevin'
    LIMIT 1
)
WHERE doctor_name = 'Dr.keven' 
AND doctor_id IS NULL;

-- Fix "Charlie K" appointments (assuming there's a Charlie doctor)
UPDATE appointments 
SET doctor_id = (
    SELECT id FROM doctors 
    WHERE LOWER(full_name) LIKE '%charlie%' 
    OR LOWER(first_name) = 'charlie'
    LIMIT 1
)
WHERE doctor_name = 'Charlie K' 
AND doctor_id IS NULL;

-- Fix "Andrew" appointments
UPDATE appointments 
SET doctor_id = (
    SELECT id FROM doctors 
    WHERE LOWER(full_name) LIKE '%andrew%' 
    OR LOWER(first_name) = 'andrew'
    LIMIT 1
)
WHERE doctor_name = 'Andrew' 
AND doctor_id IS NULL;

-- ===================================================================
-- 5. CREATE FUNCTION TO AUTO-POPULATE DOCTOR_ID
-- ===================================================================

-- Function to automatically set doctor_id when doctor_name is provided
CREATE OR REPLACE FUNCTION populate_doctor_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If doctor_name is set but doctor_id is not, try to find matching doctor
    IF NEW.doctor_name IS NOT NULL AND NEW.doctor_id IS NULL THEN
        -- Try exact match first
        SELECT id INTO NEW.doctor_id
        FROM doctors 
        WHERE LOWER(full_name) = LOWER(NEW.doctor_name)
        LIMIT 1;
        
        -- If no exact match, try partial matches
        IF NEW.doctor_id IS NULL THEN
            SELECT id INTO NEW.doctor_id
            FROM doctors 
            WHERE LOWER(full_name) LIKE '%' || LOWER(NEW.doctor_name) || '%'
            OR LOWER(first_name) = LOWER(SPLIT_PART(NEW.doctor_name, ' ', 1))
            LIMIT 1;
        END IF;
        
        -- If still no match, try fuzzy matching
        IF NEW.doctor_id IS NULL THEN
            SELECT id INTO NEW.doctor_id
            FROM doctors 
            WHERE NEW.doctor_name ILIKE '%' || first_name || '%'
            OR NEW.doctor_name ILIKE '%' || last_name || '%'
            LIMIT 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC DOCTOR_ID POPULATION
-- ===================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_populate_doctor_id_insert ON appointments;
DROP TRIGGER IF EXISTS trigger_populate_doctor_id_update ON appointments;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_populate_doctor_id_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_doctor_id();

-- Create trigger for UPDATE operations
CREATE TRIGGER trigger_populate_doctor_id_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.doctor_name IS DISTINCT FROM NEW.doctor_name OR NEW.doctor_id IS NULL)
    EXECUTE FUNCTION populate_doctor_id();

-- ===================================================================
-- 7. UPDATE DOCTOR DASHBOARD SERVICE QUERY
-- ===================================================================

-- Create a view that handles both doctor_id and doctor_name filtering
CREATE OR REPLACE VIEW doctor_appointments_view AS
SELECT 
    a.*,
    d.full_name as resolved_doctor_name,
    d.specialization as resolved_doctor_specialty,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.full_name as patient_full_name,
    p.email as patient_email,
    p.phone as patient_phone,
    c.clinic_name,
    c.address as clinic_address
FROM appointments a
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN patients p ON a.patient_id = p.id  
LEFT JOIN clinics c ON a.clinic_id = c.id;

-- Grant permissions
GRANT SELECT ON doctor_appointments_view TO authenticated;

-- ===================================================================
-- 8. VERIFICATION QUERIES
-- ===================================================================

-- Check the results after our fixes
SELECT 
    'After Fix - Doctor Appointment Status' as analysis,
    COUNT(*) as total_appointments,
    COUNT(doctor_id) as with_doctor_id,
    COUNT(doctor_name) as with_doctor_name,
    COUNT(*) - COUNT(doctor_id) as missing_doctor_id,
    COUNT(CASE WHEN doctor_id IS NOT NULL AND doctor_name IS NOT NULL THEN 1 END) as complete_doctor_info
FROM appointments;

-- Show appointments for specific doctor IDs from your data
SELECT 
    'Appointments for doctor a35516af-53a9-4ed2-9329-bbe2126bb972' as query_type,
    id,
    patient_id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    status
FROM appointments 
WHERE doctor_id = 'a35516af-53a9-4ed2-9329-bbe2126bb972'
ORDER BY appointment_date DESC;

SELECT 
    'Appointments for doctor 415503c8-0340-4517-8ae1-7e62d75d5128' as query_type,
    id,
    patient_id,
    doctor_name,
    doctor_id,
    appointment_date,
    appointment_time,
    status
FROM appointments 
WHERE doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128'
ORDER BY appointment_date DESC;

-- Test the new view
SELECT 
    'Using doctor_appointments_view' as query_type,
    id,
    patient_first_name,
    patient_last_name,
    doctor_name,
    resolved_doctor_name,
    appointment_date,
    appointment_time
FROM doctor_appointments_view 
WHERE doctor_id = 'a35516af-53a9-4ed2-9329-bbe2126bb972'
   OR doctor_id = '415503c8-0340-4517-8ae1-7e62d75d5128'
ORDER BY appointment_date DESC;

-- Show any remaining appointments without doctor_id
SELECT 
    'Remaining appointments without doctor_id' as issue_type,
    id,
    doctor_name,
    appointment_date,
    appointment_time,
    patient_id
FROM appointments 
WHERE doctor_name IS NOT NULL 
AND doctor_id IS NULL
ORDER BY appointment_date DESC;

RAISE NOTICE '✅ Doctor appointment visibility fixes completed!';
RAISE NOTICE 'Check the verification queries above to see the results';
RAISE NOTICE 'The doctor dashboard should now show appointments properly';