-- Auto-confirm emails for clinic-created doctor accounts
-- This script creates a database trigger that automatically confirms emails
-- for doctors created by clinics

-- Create a function to handle email confirmation for clinic-created doctors
CREATE OR REPLACE FUNCTION handle_doctor_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a clinic-created doctor account
  IF NEW.is_clinic_created = true AND NEW.user_id IS NOT NULL THEN
    -- Update the auth.users table to confirm the email
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function after doctor insertion
DROP TRIGGER IF EXISTS trigger_doctor_email_confirmation ON doctors;
CREATE TRIGGER trigger_doctor_email_confirmation
  AFTER INSERT ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION handle_doctor_email_confirmation();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_doctor_email_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_doctor_email_confirmation() TO service_role;

-- Note: This trigger requires the service_role to have access to auth.users table
-- You may need to run this in the Supabase SQL Editor with admin privileges 