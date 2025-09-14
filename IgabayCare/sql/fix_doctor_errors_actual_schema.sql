-- Fix doctor-side errors based on your actual database schema
-- Run this in your Supabase SQL Editor

-- 1. ADD MISSING DOCTOR_SPECIALTY COLUMN TO APPOINTMENTS TABLE
-- This is the main missing column causing PGRST204 errors
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(255);

-- Populate existing appointments with doctor specialization data
UPDATE public.appointments 
SET doctor_specialty = d.specialization
FROM public.doctors d
WHERE appointments.doctor_id IS NOT NULL 
AND appointments.doctor_specialty IS NULL
AND appointments.doctor_id = d.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_specialty ON public.appointments(doctor_specialty);

-- 2. ENSURE PROPER INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);

-- 3. CREATE FUNCTION TO AUTO-CONFIRM DOCTOR EMAILS (if not exists)
CREATE OR REPLACE FUNCTION public.auto_confirm_doctor_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm emails for doctors created by clinics
  IF NEW.raw_user_meta_data->>'role' = 'doctor' 
     AND (NEW.raw_user_meta_data->>'created_by_clinic' = 'true' 
          OR NEW.raw_user_meta_data->>'is_clinic_created' = 'true') THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE TRIGGER FOR AUTO-CONFIRMING DOCTOR EMAILS (if not exists)
DROP TRIGGER IF EXISTS auto_confirm_doctor_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_doctor_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_doctor_emails();

-- 5. UPDATE RLS POLICIES FOR DOCTORS TABLE
DROP POLICY IF EXISTS "Doctors can view and update own profile" ON public.doctors;
CREATE POLICY "Doctors can view and update own profile" ON public.doctors
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clinics can view and manage their doctors" ON public.doctors;
CREATE POLICY "Clinics can view and manage their doctors" ON public.doctors
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.clinics WHERE id = doctors.clinic_id
    )
  );

-- Ensure RLS is enabled on doctors table
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 6. UPDATE RLS POLICIES FOR REVIEWS TABLE
DROP POLICY IF EXISTS "Doctors can view their reviews" ON public.reviews;
CREATE POLICY "Doctors can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.doctors WHERE id = reviews.doctor_id
    )
  );

DROP POLICY IF EXISTS "Clinics can view their reviews" ON public.reviews;
CREATE POLICY "Clinics can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.clinics WHERE id = reviews.clinic_id
    )
  );

-- 7. GRANT NECESSARY PERMISSIONS
GRANT ALL ON public.doctors TO authenticated;
GRANT SELECT ON public.doctors TO anon;
GRANT ALL ON public.appointments TO authenticated;
GRANT SELECT ON public.appointments TO anon;
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;

-- 8. VERIFICATION QUERIES
-- Check if doctor_specialty column was added successfully
SELECT 'APPOINTMENTS TABLE DOCTOR_SPECIALTY CHECK:' as info;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_specialty) as appointments_with_specialty,
    COUNT(CASE WHEN doctor_id IS NOT NULL THEN 1 END) as appointments_with_doctor
FROM public.appointments;

-- Show sample appointments with doctor info
SELECT 'SAMPLE APPOINTMENTS WITH DOCTOR INFO:' as info;
SELECT 
    a.id, 
    a.patient_name,
    a.doctor_name,
    d.full_name as actual_doctor_name,
    a.doctor_specialty,
    d.specialization as actual_doctor_specialization,
    a.appointment_date,
    a.status
FROM public.appointments a
LEFT JOIN public.doctors d ON a.doctor_id = d.id
WHERE a.doctor_id IS NOT NULL
ORDER BY a.appointment_date DESC
LIMIT 5;

-- Check doctors table structure
SELECT 'DOCTORS TABLE SAMPLE:' as info;
SELECT id, full_name, email, specialization, status, clinic_id, user_id, created_at
FROM public.doctors
ORDER BY created_at DESC
LIMIT 3;