-- QUICK FIX: Add missing doctor_specialty column to appointments table
-- This fixes the PGRST204 error: "Could not find the 'doctor_specialty' column"

-- ===================================================================
-- ADD MISSING doctor_specialty COLUMN
-- ===================================================================

-- Add doctor_specialty column if it doesn't exist
DO $$
BEGIN
    -- Check if doctor_specialty column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'doctor_specialty'
    ) THEN
        -- Add doctor_specialty column as VARCHAR(255)
        ALTER TABLE public.appointments 
        ADD COLUMN doctor_specialty VARCHAR(255);
        
        RAISE NOTICE '✅ Added doctor_specialty column to appointments table';
    ELSE
        RAISE NOTICE '✅ doctor_specialty column already exists';
    END IF;
END $$;

-- ===================================================================
-- POPULATE doctor_specialty FROM EXISTING DOCTOR DATA
-- ===================================================================

-- Try to populate doctor_specialty based on doctor_id where possible
UPDATE public.appointments 
SET doctor_specialty = d.specialization
FROM public.doctors d
WHERE appointments.doctor_id IS NOT NULL 
AND appointments.doctor_specialty IS NULL
AND appointments.doctor_id = d.id;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
AND column_name = 'doctor_specialty';

-- Show count of appointments with doctor_specialty populated
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_specialty) as appointments_with_specialty,
    COUNT(*) - COUNT(doctor_specialty) as appointments_without_specialty
FROM public.appointments;

-- Show sample data
SELECT 
    id,
    doctor_name,
    doctor_specialty,
    appointment_date,
    appointment_time
FROM public.appointments 
WHERE doctor_name IS NOT NULL
LIMIT 5;