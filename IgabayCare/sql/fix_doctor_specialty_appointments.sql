-- Fix doctor specialty column error in appointments table
-- This script adds the missing doctor_specialty column that causes PGRST204 errors

-- Add missing doctor_specialty column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(255);

-- Populate existing records from doctors table
UPDATE public.appointments 
SET doctor_specialty = d.specialization
FROM public.doctors d
WHERE appointments.doctor_id IS NOT NULL 
AND appointments.doctor_specialty IS NULL
AND appointments.doctor_id = d.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_specialty ON public.appointments(doctor_specialty);

-- Show verification query
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_specialty) as appointments_with_specialty
FROM public.appointments
WHERE doctor_id IS NOT NULL;