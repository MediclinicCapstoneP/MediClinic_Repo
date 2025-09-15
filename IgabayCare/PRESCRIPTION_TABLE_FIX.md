# Prescription Table Schema Fix

## Problem
The application is throwing a PGRST204 error: "Could not find the 'clinical_notes' column of 'prescriptions' in the schema cache". This indicates that the prescriptions table is missing required columns.

## Solution
Execute the `fix_prescriptions_table.sql` script to add all missing columns to the prescriptions table.

## How to Fix

### Option 1: Using Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database/fix_prescriptions_table.sql`
4. Click "Run" to execute the script

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --local
# Or apply the migration
psql -h localhost -p 54322 -U postgres -d postgres < database/fix_prescriptions_table.sql
```

### Option 3: Using psql directly
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres" < database/fix_prescriptions_table.sql
```

## What the Script Does
- Adds missing columns to the prescriptions table:
  - `clinical_notes` (TEXT)
  - `patient_symptoms` (TEXT)
  - `diagnosis` (TEXT)
  - `doctor_specialty` (TEXT)
  - `general_instructions` (TEXT)
  - `dietary_restrictions` (TEXT)
  - `follow_up_instructions` (TEXT)
  - `prescribing_doctor_license` (TEXT)
  - `valid_until` (DATE)
  - `status` (TEXT with constraints)
- Creates proper indexes for better performance
- Refreshes the schema cache

## After Running the Script
The prescription creation functionality should work without errors. The doctor will be able to create prescriptions with all the required medical information.

## Verification
After running the script, you can verify the fix by:
1. Trying to create a prescription through the doctor interface
2. The error should no longer appear
3. Prescriptions should be created successfully with all medical details
