-- ============================================================================
-- COMPREHENSIVE DOCTOR SIDE DATABASE FIXES
-- ============================================================================
-- This script fixes all identified database issues for the doctor-side functionality
-- Run this script in your Supabase SQL Editor to resolve all doctor-side errors
-- ============================================================================

-- 1. FIX REVIEWS TABLE SCHEMA
-- ============================================================================
-- Add missing columns that the application expects
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS title varchar(200);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS comment text;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS wait_time_rating integer CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS staff_friendliness_rating integer CHECK (staff_friendliness_rating >= 1 AND staff_friendliness_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden', 'deleted'));

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS appointment_id uuid;

-- Add foreign key constraint for appointment_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reviews_appointment_id_fkey' 
        AND table_name = 'reviews'
    ) THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT reviews_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing records to have the new required columns
UPDATE public.reviews 
SET 
    overall_rating = rating,
    status = 'active'
WHERE overall_rating IS NULL OR status IS NULL;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON public.reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON public.reviews(appointment_id);

-- 2. FIX APPOINTMENTS TABLE - ADD DOCTOR SPECIALTY COLUMN
-- ============================================================================
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

-- 3. FIX DOCTOR AUTHENTICATION SYSTEM
-- ============================================================================
-- Create function to auto-confirm doctor emails created by clinics
CREATE OR REPLACE FUNCTION public.auto_confirm_doctor_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm emails for doctors created by clinics
  IF NEW.raw_user_meta_data->>'role' = 'doctor' 
     AND NEW.raw_user_meta_data->>'created_by_clinic' = 'true' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-confirming doctor emails
DROP TRIGGER IF EXISTS auto_confirm_doctor_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_doctor_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_doctor_emails();

-- Create function to handle doctor email conflicts
CREATE OR REPLACE FUNCTION public.handle_doctor_email_conflict(
  p_email TEXT,
  p_doctor_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  existing_user_id UUID;
  result JSONB;
BEGIN
  -- Check if email already exists in auth.users
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- Check if this user is already a doctor
    IF EXISTS (SELECT 1 FROM public.doctors WHERE user_id = existing_user_id) THEN
      result := jsonb_build_object(
        'error', true,
        'message', 'This email is already registered as a doctor',
        'code', 'DOCTOR_EXISTS'
      );
    ELSE
      result := jsonb_build_object(
        'error', true,
        'message', 'This email is already registered with a different role',
        'code', 'EMAIL_CONFLICT'
      );
    END IF;
  ELSE
    result := jsonb_build_object(
      'error', false,
      'message', 'Email is available'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on doctors.email if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctors_email_unique' 
        AND table_name = 'doctors'
    ) THEN
        ALTER TABLE public.doctors 
        ADD CONSTRAINT doctors_email_unique UNIQUE (email);
    END IF;
END $$;

-- Add index on doctors.user_id for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);

-- 4. UPDATE RLS POLICIES FOR REVIEWS TABLE
-- ============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Patients can create and view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clinics can view their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Doctors can view their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view active reviews" ON public.reviews;

-- Create new RLS policies that work with your schema
CREATE POLICY "Patients can create and view own reviews" ON public.reviews
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.patients WHERE id = reviews.patient_id
    )
  );

CREATE POLICY "Clinics can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.clinics WHERE id = reviews.clinic_id
    )
  );

CREATE POLICY "Doctors can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.doctors WHERE id = reviews.doctor_id
    )
  );

CREATE POLICY "Public can view active reviews" ON public.reviews
  FOR SELECT USING (
    (status IS NULL OR status = 'active') AND is_verified = true
  );

-- Ensure RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. UPDATE RLS POLICIES FOR DOCTORS TABLE
-- ============================================================================
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

-- Ensure RLS is enabled
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 6. GRANT NECESSARY PERMISSIONS
-- ============================================================================
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.doctors TO authenticated;
GRANT SELECT ON public.doctors TO anon;
GRANT ALL ON public.appointments TO authenticated;
GRANT SELECT ON public.appointments TO anon;

-- 7. ADD SAMPLE DATA FOR TESTING (OPTIONAL - REMOVE IF NOT NEEDED)
-- ============================================================================
-- Add some sample data to test (you can remove this section if not needed)
INSERT INTO public.reviews (
    patient_id, 
    clinic_id, 
    doctor_id, 
    rating, 
    overall_rating, 
    title, 
    comment, 
    status, 
    is_verified
)
SELECT 
    p.id as patient_id,
    c.id as clinic_id,
    d.id as doctor_id,
    5 as rating,
    5 as overall_rating,
    'Great Service!' as title,
    'Excellent experience with professional staff.' as comment,
    'active' as status,
    true as is_verified
FROM public.patients p
CROSS JOIN public.clinics c
CROSS JOIN public.doctors d
LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. VERIFICATION QUERIES
-- ============================================================================
-- Show final table structures and verify fixes
SELECT 'REVIEWS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'APPOINTMENTS TABLE DOCTOR_SPECIALTY CHECK:' as info;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(doctor_specialty) as appointments_with_specialty
FROM public.appointments
WHERE doctor_id IS NOT NULL;

SELECT 'DOCTORS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- The following issues have been resolved:
-- ✅ Reviews table missing columns error
-- ✅ Doctor specialty column missing from appointments
-- ✅ Doctor authentication and email confirmation issues
-- ✅ RLS policies updated for proper security
-- ✅ Database indexes added for performance
-- ✅ Sample data added for testing
--
-- After running this script:
-- 1. Doctor sign-in should work without refresh token errors
-- 2. Doctor dashboard should load without database errors
-- 3. Appointment management should work without PGRST204 errors
-- 4. Reviews and ratings should display properly
-- 5. Doctor creation by clinics should work smoothly
-- ============================================================================