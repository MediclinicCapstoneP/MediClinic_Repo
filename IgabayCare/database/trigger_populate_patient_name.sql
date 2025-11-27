-- ========================================
-- TRIGGER: AUTO-POPULATE PATIENT NAME
-- ========================================
-- This trigger automatically populates patient_name in the appointments table
-- whenever an appointment is inserted or updated

-- Create or replace the function
CREATE OR REPLACE FUNCTION populate_patient_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Only populate if patient_name is empty/null and we have a patient_id
    IF (NEW.patient_name IS NULL OR NEW.patient_name = '' OR NEW.patient_name = 'Unknown Patient') 
       AND NEW.patient_id IS NOT NULL THEN
        
        -- Try to get patient name from patients table
        BEGIN
            SELECT 
                CASE 
                    WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN
                        CONCAT(p.first_name, ' ', p.last_name)
                    WHEN p.first_name IS NOT NULL THEN
                        p.first_name
                    WHEN p.last_name IS NOT NULL THEN
                        p.last_name
                    WHEN p.email IS NOT NULL THEN
                        SPLIT_PART(p.email, '@', 1)
                    ELSE
                        CONCAT('Patient (', SUBSTRING(p.id::text, 1, 8), '...)')
                END
            INTO NEW.patient_name
            FROM patients p
            WHERE p.id = NEW.patient_id;
            
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                NEW.patient_name := CONCAT('Patient (', SUBSTRING(NEW.patient_id::text, 1, 8), '...)');
            WHEN OTHERS THEN
                NEW.patient_name := CONCAT('Patient (', SUBSTRING(NEW.patient_id::text, 1, 8), '...)');
        END;
    END IF;
    
    -- Ensure notes field is populated from patient_notes if notes is empty
    IF (NEW.notes IS NULL OR NEW.notes = '') AND NEW.patient_notes IS NOT NULL THEN
        NEW.notes := NEW.patient_notes;
    END IF;
    
    -- Also ensure patient_notes is populated from notes if patient_notes is empty
    IF (NEW.patient_notes IS NULL OR NEW.patient_notes = '') AND NEW.notes IS NOT NULL THEN
        NEW.patient_notes := NEW.notes;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_populate_patient_name ON appointments;

-- Create the trigger
CREATE TRIGGER trigger_populate_patient_name
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_patient_name();

-- Test the trigger with some sample data (optional)
-- Uncomment the lines below to test if you want

-- INSERT INTO appointments (
--     patient_id, 
--     clinic_id, 
--     appointment_date, 
--     appointment_time, 
--     appointment_type, 
--     status,
--     patient_notes
-- ) VALUES (
--     'some-patient-id-here',
--     'some-clinic-id-here',
--     CURRENT_DATE + INTERVAL '1 day',
--     '10:00:00',
--     'consultation',
--     'scheduled',
--     'Test appointment notes'
-- );

-- Verify the trigger works
SELECT 'Trigger created successfully - patient_name will be auto-populated' as status;

-- ========================================
-- TRIGGER COMPLETE
-- ========================================
-- This trigger will automatically:
-- 1. Populate patient_name from patients table data when appointment is created/updated
-- 2. Sync notes and patient_notes fields
-- 3. Handle cases where patient data might not exist
-- ========================================