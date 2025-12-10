# Fix Doctor Appointments Trigger

## Problem
When assigning a doctor to an appointment, the `patient_name`, `patient_email`, and `patient_phone` fields were being set to `NULL` in the `doctor_appointments` table, even though the application code was explicitly setting these values.

## Root Cause
A database trigger (`populate_doctor_appointment_data_trigger`) was running **BEFORE INSERT** and **always overwriting** the patient fields, regardless of whether they were already explicitly set by the application code.

The trigger was designed to auto-populate patient data, but it didn't check if the values were already set, causing it to overwrite explicit values with NULL (if the patient lookup failed or had issues).

## Solution
Run the SQL script `fix_doctor_appointments_trigger.sql` in your Supabase SQL Editor. This script:

1. **Drops the existing trigger** that was overwriting values
2. **Creates an improved trigger** that:
   - Only populates `patient_name` if it's NULL, empty, or 'Unknown Patient'
   - Only populates `patient_email` if it's NULL or empty
   - Only populates `patient_phone` if it's NULL or empty
   - **Respects explicitly set values** from the application code
   - Still provides fallback values if fields are empty and patient data can be fetched

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Copy the contents of `database/fix_doctor_appointments_trigger.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Fix**
   - The script will output verification queries showing the updated trigger
   - You should see the trigger was created successfully

## What Changed

### Before (Old Trigger)
```sql
-- Always overwrote values, even if explicitly set
NEW.patient_name := TRIM(BOTH ' ' FROM patient_record.full_name);
NEW.patient_email := patient_record.email;
NEW.patient_phone := patient_record.phone;
```

### After (New Trigger)
```sql
-- Only populates if field is NULL or empty
IF NEW.patient_name IS NULL OR TRIM(NEW.patient_name) = '' OR NEW.patient_name = 'Unknown Patient' THEN
    NEW.patient_name := TRIM(BOTH ' ' FROM patient_record.full_name);
END IF;

IF NEW.patient_email IS NULL OR TRIM(NEW.patient_email) = '' THEN
    NEW.patient_email := patient_record.email;
END IF;
```

## Testing

After running the script, test the doctor assignment:
1. Log in as a clinic
2. Go to Appointments tab
3. Assign a doctor to an appointment
4. Check the `doctor_appointments` table - patient_name, patient_email, and patient_phone should now be populated correctly

## Additional Improvements

The application code has also been improved to:
- Always fetch patient data before creating doctor appointments
- Pass explicit patient values to the service
- Include better logging to track data flow

The combination of the fixed trigger + improved application code ensures patient data is always correctly saved.

