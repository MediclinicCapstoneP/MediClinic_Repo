# Doctor Authentication Setup Guide

## Overview
This guide explains how to set up Supabase authentication for clinic-created doctor accounts, allowing doctors to sign in through the standard authentication system.

## Prerequisites
- Supabase project with authentication enabled
- Admin access to Supabase SQL Editor
- Existing doctors table with authentication fields

## Setup Steps

### 1. Run the Auto-Confirm Email Script

Execute the following SQL in your Supabase SQL Editor:

```sql
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
```

### 2. Update RLS Policies

Ensure your doctors table has the correct RLS policies:

```sql
-- Allow doctors to view their own profile
CREATE POLICY "Doctors can view their own profile" ON doctors
    FOR SELECT USING (user_id = auth.uid());

-- Allow doctors to update their own profile
CREATE POLICY "Doctors can update their own profile" ON doctors
    FOR UPDATE USING (user_id = auth.uid());

-- Allow clinic owners to manage their doctors
CREATE POLICY "Clinic owners can manage their doctors" ON doctors
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM clinics WHERE user_id = auth.uid()
        )
    );
```

### 3. Verify Database Schema

Ensure your doctors table has the required fields:

```sql
-- Check if the required fields exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('user_id', 'is_clinic_created', 'password_hash');
```

## How It Works

### For Clinics:
1. **Log in** to clinic dashboard
2. **Go to Doctors section**
3. **Click "Add Doctor"**
4. **Fill in doctor details** including email and password
5. **Submit** - The system will:
   - Create a Supabase auth user with 'doctor' role
   - Create a doctor profile in the doctors table
   - Auto-confirm the email via database trigger
   - Display success message

### For Doctors:
1. **Visit** the doctor sign-in page
2. **Enter email and password** provided by clinic
3. **Sign in** - The system will:
   - Authenticate via Supabase auth
   - Verify the user has 'doctor' role
   - Load doctor profile from database
   - Grant access to doctor dashboard

## Security Features

- **Role-based authentication** - Only users with 'doctor' role can access doctor features
- **Email confirmation** - Automatically confirmed for clinic-created accounts
- **Password hashing** - Passwords are hashed and stored securely
- **RLS policies** - Row Level Security ensures data protection
- **Session management** - Uses Supabase auth sessions

## Troubleshooting

### Common Issues:

1. **"Invalid user role" error**
   - Check that the user_metadata contains `role: 'doctor'`
   - Verify the auth user was created correctly

2. **"Doctor profile not found" error**
   - Ensure the doctor record exists in the doctors table
   - Check that user_id matches between auth.users and doctors table

3. **Email not confirmed**
   - Run the auto-confirm trigger script
   - Check that the trigger function has proper permissions

4. **RLS policy errors**
   - Verify RLS policies are correctly configured
   - Check that the authenticated user has proper permissions

### Testing:

1. **Create a test doctor account** through the clinic interface
2. **Check Supabase Auth** - Verify the user exists in auth.users
3. **Check doctors table** - Verify the profile exists with correct user_id
4. **Test login** - Try signing in with the doctor credentials
5. **Verify access** - Ensure the doctor can access their dashboard

## Files Modified

- `src/features/auth/utils/doctorService.ts` - Updated createDoctor and doctorLogin methods
- `src/pages/clinic/ClinicDoctors.tsx` - Updated success message
- `database/auto_confirm_doctor_emails.sql` - Database trigger for auto-confirmation
- `database/DOCTOR_AUTH_SETUP.md` - This setup guide

## Next Steps

After completing this setup:

1. **Test the complete flow** from clinic creation to doctor login
2. **Monitor logs** for any authentication errors
3. **Consider implementing** additional security measures like:
   - Password strength requirements
   - Account lockout after failed attempts
   - Two-factor authentication
   - Session timeout settings

The system is now ready for clinic-created doctor accounts with full Supabase authentication! 🎉 