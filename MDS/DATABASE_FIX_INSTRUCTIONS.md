# Database Fix Instructions for Patient-Side Errors

## Problem Summary
Your IgabayCare patient-side functionality is experiencing two critical database errors:

1. **Prescription Relationship Error (PGRST200)**: 
   - Error: "Could not find a relationship between 'prescriptions' and 'prescription_medications'"
   - Cause: Supabase schema cache not recognizing the foreign key relationship

2. **Notifications Column Error (42703)**:
   - Error: "column notifications.expires_at does not exist"
   - Cause: Missing `expires_at` column in notifications table

## Solution
I've created a comprehensive database fix script: `database/fix_patient_side_errors.sql`

## How to Execute the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/fix_patient_side_errors.sql`
4. Click **Run** to execute the script

### Option 2: Command Line (if you have psql access)
```bash
# If you have direct PostgreSQL access
psql -h your-supabase-host -U postgres -d postgres -f database/fix_patient_side_errors.sql
```

### Option 3: Supabase CLI (if installed)
```bash
# If you have Supabase CLI set up
supabase db reset --linked
# Then run your migrations
```

## What the Fix Does

1. **Adds missing `expires_at` column** to notifications table
2. **Refreshes prescription relationships** by recreating foreign key constraints
3. **Updates schema cache** to ensure Supabase recognizes relationships
4. **Recreates RLS policies** for proper data access
5. **Adds proper indexes** for performance
6. **Verifies the fixes** with test queries

## After Running the Fix

1. **Clear your browser cache** to ensure fresh API calls
2. **Restart your development server** if running locally
3. **Test patient functionality**:
   - Try viewing prescriptions in patient dashboard
   - Check notifications dropdown
   - Verify appointment booking works

## Expected Results

After running the fix, these errors should be resolved:
- ✅ Prescriptions will load properly with medication details
- ✅ Notifications will display without expires_at column errors
- ✅ Patient dashboard will function normally

## If Issues Persist

If you still see errors after running the fix:

1. Check Supabase logs in your dashboard
2. Verify the script ran successfully (look for success messages)
3. Try refreshing your browser and clearing cache
4. Restart your development server

The fix script includes verification queries that will show "PASS" status if everything is working correctly.
