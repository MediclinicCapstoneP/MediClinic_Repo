-- DISPLAY PATIENT NAME FOR SPECIFIC APPOINTMENT
-- This script helps display patient information for the appointment with ID: c97d7adb-3b0d-4c13-ae5e-0c820a56550a

-- ===================================================================
-- 1. FETCH PATIENT NAME FOR THE SPECIFIC APPOINTMENT
-- ===================================================================

-- Get the patient details for the given appointment
SELECT 
    a.id as appointment_id,
    a.patient_id,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.email,
    p.phone,
    a.appointment_date,
    a.appointment_time,
    a.appointment_type,
    a.status,
    a.doctor_name,
    a.doctor_specialty,
    a.clinic_id,
    c.clinic_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id
WHERE a.id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';

-- ===================================================================
-- 2. UPDATE APPOINTMENT TO INCLUDE PATIENT NAME
-- ===================================================================

-- Option 1: Add patient_name column to appointments table if it doesn't exist
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
        RAISE NOTICE '✅ patient_name column already exists';
    END IF;
END $$;

-- Option 2: Update the specific appointment with patient name
UPDATE appointments 
SET patient_name = CONCAT(p.first_name, ' ', p.last_name)
FROM patients p
WHERE appointments.patient_id = p.id 
AND appointments.id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';

-- ===================================================================
-- 3. BULK UPDATE ALL APPOINTMENTS WITH PATIENT NAMES
-- ===================================================================

-- Update all appointments to include patient names
UPDATE appointments 
SET patient_name = CONCAT(p.first_name, ' ', p.last_name)
FROM patients p
WHERE appointments.patient_id = p.id 
AND appointments.patient_name IS NULL;

-- ===================================================================
-- 4. VERIFICATION QUERIES
-- ===================================================================

-- Verify the update for the specific appointment
SELECT 
    id,
    patient_id,
    patient_name,
    appointment_date,
    appointment_time,
    appointment_type,
    status
FROM appointments 
WHERE id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';

-- Show all appointments with patient names
SELECT 
    a.id,
    a.patient_name,
    a.appointment_date,
    a.appointment_time,
    a.appointment_type,
    a.status,
    a.doctor_name,
    c.clinic_name
FROM appointments a
LEFT JOIN clinics c ON a.clinic_id = c.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC
LIMIT 10;

-- Count appointments with and without patient names
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_name) as appointments_with_names,
    COUNT(*) - COUNT(patient_name) as appointments_without_names
FROM appointments;

-- ===================================================================
-- 5. CREATE VIEW FOR EASIER APPOINTMENT DISPLAY
-- ===================================================================

-- Create a view that automatically joins appointments with patient information
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id as appointment_id,
    a.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.email as patient_email,
    p.phone as patient_phone,
    a.clinic_id,
    c.clinic_name,
    a.doctor_id,
    a.doctor_name,
    a.doctor_specialty,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.appointment_type,
    a.status,
    a.priority,
    a.patient_notes,
    a.doctor_notes,
    a.payment_amount,
    a.created_at,
    a.updated_at
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id;

-- Grant permissions for the view
GRANT SELECT ON appointment_details TO authenticated;
GRANT SELECT ON appointment_details TO anon;

-- Test the view with our specific appointment
SELECT * FROM appointment_details 
WHERE appointment_id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';