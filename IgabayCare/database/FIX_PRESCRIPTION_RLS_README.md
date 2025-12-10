# Fix Prescription Medications RLS Policy

## Problem
Doctors are getting a 403 Forbidden error when trying to add prescription medications:
```
new row violates row-level security policy for table "prescription_medications"
```

## Root Cause
The RLS policy for `prescription_medications` is missing a `WITH CHECK` clause, which is required for INSERT operations. The current policy only has a `USING` clause, which applies to SELECT/UPDATE/DELETE but not INSERT.

## Solution
Run the SQL script `fix_prescription_medications_rls.sql` in your Supabase SQL Editor.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Copy the contents of `database/fix_prescription_medications_rls.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Fix**
   - The script will output verification queries showing the updated policies
   - You should see both `USING` and `WITH CHECK` clauses for the doctor policies

## What the Script Does

1. **Drops the existing policy** that's missing the `WITH CHECK` clause
2. **Recreates the policy** with both:
   - `USING` clause: For SELECT/UPDATE/DELETE operations
   - `WITH CHECK` clause: For INSERT/UPDATE operations (this was missing!)
3. **Also fixes the prescriptions policy** to ensure doctors can create prescriptions
4. **Verifies the policies** were created correctly

## After Running the Script

The prescription creation flow should now work:
- Doctor creates a prescription → ✅ Allowed by prescriptions policy
- Doctor adds medications to the prescription → ✅ Allowed by prescription_medications policy (WITH CHECK clause)

## Testing

After running the script, test the prescription creation:
1. Log in as a doctor
2. Go to Appointments tab
3. Click "Prescription" on an appointment
4. Fill in medication details
5. Submit the prescription

It should now work without the 403 error!

