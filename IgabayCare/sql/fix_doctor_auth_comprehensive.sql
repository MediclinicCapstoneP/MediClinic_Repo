-- Comprehensive fix for doctor authentication and creation issues
-- This script addresses doctor email confirmation and user creation problems

-- 1. Create function to auto-confirm doctor emails created by clinics
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

-- 2. Create trigger for auto-confirming doctor emails
DROP TRIGGER IF EXISTS auto_confirm_doctor_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_doctor_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_doctor_emails();

-- 3. Create function to handle doctor email conflicts
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

-- 4. Add unique constraint on doctors.email if not exists
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

-- 5. Add index on doctors.user_id for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);

-- 6. Update RLS policies for doctors table
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

-- 7. Ensure RLS is enabled
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 8. Grant necessary permissions
GRANT ALL ON public.doctors TO authenticated;
GRANT SELECT ON public.doctors TO anon;

-- 9. Show verification queries
SELECT 'Doctor table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;