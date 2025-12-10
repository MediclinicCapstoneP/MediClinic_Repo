-- ===================================================================
-- FIX DOCTOR APPOINTMENTS TRIGGER TO RESPECT EXPLICIT VALUES
-- ===================================================================
-- This script fixes the trigger that was overwriting patient_name,
-- patient_email, and patient_phone even when they were explicitly set
-- ===================================================================

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS populate_doctor_appointment_data() CASCADE;
DROP TRIGGER IF EXISTS populate_doctor_appointment_data_trigger ON doctor_appointments;

-- Create the improved trigger function that ONLY populates if fields are NULL/empty
CREATE OR REPLACE FUNCTION populate_doctor_appointment_data()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    clinic_record RECORD;
BEGIN
    -- Log the trigger execution (for debugging)
    RAISE NOTICE 'Populating doctor appointment data for patient_id: %, clinic_id: %', NEW.patient_id, NEW.clinic_id;
    
    -- Get patient information ONLY if not already explicitly set
    IF NEW.patient_id IS NOT NULL THEN
        -- Only populate patient_name if it's NULL or empty
        IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' OR NEW.patient_name = 'Unknown Patient' THEN
            BEGIN
                SELECT 
                    COALESCE(TRIM(first_name), '') || ' ' || COALESCE(TRIM(last_name), '') as full_name,
                    email,
                    phone
                INTO patient_record
                FROM patients 
                WHERE id = NEW.patient_id;
                
                IF FOUND THEN
                    -- Clean up the name and set fields ONLY if they're not already set
                    IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' OR NEW.patient_name = 'Unknown Patient' THEN
                        NEW.patient_name := TRIM(BOTH ' ' FROM patient_record.full_name);
                        
                        -- If name is empty after concatenation, try using email
                        IF NEW.patient_name = '' OR NEW.patient_name = ' ' THEN
                            IF patient_record.email IS NOT NULL AND patient_record.email != '' THEN
                                NEW.patient_name := SPLIT_PART(patient_record.email, '@', 1);
                            ELSE
                                NEW.patient_name := 'Patient ' || SUBSTRING(NEW.patient_id::text, 1, 8);
                            END IF;
                        END IF;
                    END IF;
                    
                    -- Only set email if not already set
                    IF NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '' THEN
                        NEW.patient_email := patient_record.email;
                    END IF;
                    
                    -- Only set phone if not already set
                    IF NEW.patient_phone IS NULL OR TRIM(NEW.patient_phone) = '' THEN
                        NEW.patient_phone := patient_record.phone;
                    END IF;
                    
                    RAISE NOTICE 'Patient data populated: name=%, email=%', NEW.patient_name, NEW.patient_email;
                ELSE
                    RAISE WARNING 'Patient not found with ID: %', NEW.patient_id;
                    -- Only set fallback if not already set
                    IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' OR NEW.patient_name = 'Unknown Patient' THEN
                        NEW.patient_name := 'Patient ' || SUBSTRING(NEW.patient_id::text, 1, 8);
                    END IF;
                    -- Don't overwrite email/phone if they're already set
                    IF NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '' THEN
                        NEW.patient_email := NULL;
                    END IF;
                    IF NEW.patient_phone IS NULL OR TRIM(NEW.patient_phone) = '' THEN
                        NEW.patient_phone := NULL;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error fetching patient data: %', SQLERRM;
                -- Only set fallback if not already set
                IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' OR NEW.patient_name = 'Unknown Patient' THEN
                    NEW.patient_name := 'Error Loading Patient';
                END IF;
                -- Don't overwrite email/phone if they're already set
                IF NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '' THEN
                    NEW.patient_email := NULL;
                END IF;
                IF NEW.patient_phone IS NULL OR TRIM(NEW.patient_phone) = '' THEN
                    NEW.patient_phone := NULL;
                END IF;
            END;
        ELSE
            -- Patient name is already set, but check if email/phone need to be populated
            IF (NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '') OR 
               (NEW.patient_phone IS NULL OR TRIM(NEW.patient_phone) = '') THEN
                BEGIN
                    SELECT email, phone
                    INTO patient_record
                    FROM patients 
                    WHERE id = NEW.patient_id;
                    
                    IF FOUND THEN
                        IF NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '' THEN
                            NEW.patient_email := patient_record.email;
                        END IF;
                        IF NEW.patient_phone IS NULL OR TRIM(NEW.patient_phone) = '' THEN
                            NEW.patient_phone := patient_record.phone;
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Error fetching patient email/phone: %', SQLERRM;
                END;
            END IF;
        END IF;
    ELSE
        -- No patient_id, but don't overwrite if values are already set
        IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' THEN
            NEW.patient_name := 'No Patient ID';
        END IF;
    END IF;
  
    -- Get clinic information ONLY if not already set
    IF NEW.clinic_id IS NOT NULL AND (NEW.clinic_name IS NULL OR TRIM(NEW.clinic_name) = '') THEN
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
                IF NEW.clinic_name IS NULL OR TRIM(NEW.clinic_name) = '' THEN
                    NEW.clinic_name := 'Unknown Clinic';
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error fetching clinic data: %', SQLERRM;
            IF NEW.clinic_name IS NULL OR TRIM(NEW.clinic_name) = '' THEN
                NEW.clinic_name := 'Error Loading Clinic';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- CREATE THE TRIGGER
-- ===================================================================

-- Create the trigger for both INSERT and UPDATE
CREATE TRIGGER populate_doctor_appointment_data_trigger
    BEFORE INSERT OR UPDATE ON doctor_appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_doctor_appointment_data();

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Check if trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'doctor_appointments'
AND trigger_name = 'populate_doctor_appointment_data_trigger';

SELECT '✅ Trigger updated to respect explicitly set patient values!' as status;

