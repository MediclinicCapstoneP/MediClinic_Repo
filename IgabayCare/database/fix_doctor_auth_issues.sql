-- Fix Doctor Authentication Issues
-- This script addresses the Supabase auth errors when creating doctor accounts

-- ===================================================================
-- STEP 1: CREATE TRIGGER TO AUTO-CONFIRM CLINIC-CREATED DOCTOR EMAILS
-- ===================================================================

-- Function to auto-confirm emails for clinic-created doctors
CREATE OR REPLACE FUNCTION public.auto_confirm_doctor_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is a doctor user created by a clinic
  IF NEW.raw_user_meta_data ? 'role' AND 
     NEW.raw_user_meta_data->>'role' = 'doctor' AND
     NEW.raw_user_meta_data ? 'is_clinic_created' AND
     (NEW.raw_user_meta_data->>'is_clinic_created')::boolean = true THEN
    
    -- Auto-confirm the email
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
    
    -- Set email verification status
    IF NEW.raw_user_meta_data IS NULL THEN
      NEW.raw_user_meta_data = '{}';
    END IF;
    
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || '{"email_verified": true}'::jsonb;
    
    -- Log the auto-confirmation
    RAISE NOTICE 'Auto-confirmed email for clinic-created doctor: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_doctor_emails_trigger ON auth.users;

-- Create trigger to auto-confirm clinic-created doctor emails
CREATE TRIGGER auto_confirm_doctor_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_doctor_emails();

-- ===================================================================
-- STEP 2: UPDATE EXISTING UNCONFIRMED DOCTOR ACCOUNTS
-- ===================================================================

-- Auto-confirm any existing unconfirmed doctor accounts that were created by clinics
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
WHERE 
  email_confirmed_at IS NULL 
  AND raw_user_meta_data ? 'role' 
  AND raw_user_meta_data->>'role' = 'doctor'
  AND raw_user_meta_data ? 'is_clinic_created'
  AND (raw_user_meta_data->>'is_clinic_created')::boolean = true;

-- ===================================================================
-- STEP 3: ENSURE DOCTORS TABLE HAS PROPER CONSTRAINTS
-- ===================================================================

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctors_email_unique' 
    AND table_name = 'doctors'
  ) THEN
    ALTER TABLE doctors ADD CONSTRAINT doctors_email_unique UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on doctors.email';
  ELSE
    RAISE NOTICE 'Unique constraint on doctors.email already exists';
  END IF;
END $$;

-- Add index on user_id for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_doctors_user_id'
  ) THEN
    CREATE INDEX idx_doctors_user_id ON doctors(user_id);
    RAISE NOTICE 'Added index on doctors.user_id';
  ELSE
    RAISE NOTICE 'Index on doctors.user_id already exists';
  END IF;
END $$;

-- ===================================================================
-- STEP 4: CREATE FUNCTION TO HANDLE DUPLICATE EMAIL CONFLICTS
-- ===================================================================

-- Function to handle email conflicts when creating doctors
CREATE OR REPLACE FUNCTION public.handle_doctor_email_conflict(
  p_email TEXT,
  p_clinic_id UUID,
  p_full_name TEXT
) RETURNS TABLE(
  conflict_exists BOOLEAN,
  existing_doctor_id UUID,
  message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  existing_doc_id UUID;
  existing_clinic_id UUID;
BEGIN
  -- Check if email already exists in doctors table
  SELECT id, clinic_id INTO existing_doc_id, existing_clinic_id
  FROM doctors 
  WHERE email = p_email;
  
  IF existing_doc_id IS NOT NULL THEN
    IF existing_clinic_id = p_clinic_id THEN
      -- Same clinic trying to add same doctor again
      RETURN QUERY SELECT 
        true, 
        existing_doc_id, 
        'A doctor with this email already exists in your clinic.'::TEXT;
    ELSE
      -- Different clinic trying to add doctor with existing email
      RETURN QUERY SELECT 
        true, 
        existing_doc_id, 
        'This email is already registered with another clinic.'::TEXT;
    END IF;
  ELSE
    -- No conflict
    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      'No email conflict found.'::TEXT;
  END IF;
END;
$$;

-- ===================================================================
-- STEP 5: VERIFICATION QUERIES
-- ===================================================================

-- Check trigger exists
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'auto_confirm_doctor_emails_trigger';

-- Check doctor accounts confirmation status
SELECT 
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'is_clinic_created' as is_clinic_created,
  created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'doctor'
ORDER BY created_at DESC;

-- Check doctors table constraints
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'doctors' 
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

RAISE NOTICE 'Doctor authentication fixes completed successfully!';
RAISE NOTICE 'Clinic-created doctor accounts will now be auto-confirmed.';
RAISE NOTICE 'Email conflicts will be properly handled.';