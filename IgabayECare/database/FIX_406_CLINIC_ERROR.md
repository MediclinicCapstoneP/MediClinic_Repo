# Fix 406 (Not Acceptable) Error for Clinic Access

## 🚨 Problem Description
The error `406 (Not Acceptable)` occurs when trying to access clinic data from the clinic dashboard. This is typically caused by Row Level Security (RLS) policies that are preventing the authenticated user from accessing their clinic profile.

## 🔍 Root Cause Analysis
1. **RLS Policy Issues**: The current RLS policies may be too restrictive
2. **Missing Clinic Profile**: The user might not have a clinic profile in the database
3. **Authentication Mismatch**: The user ID might not match the clinic's user_id
4. **Policy Conflicts**: Multiple policies might be conflicting with each other

## 🛠️ Solution Steps

### Step 1: Run the Comprehensive RLS Fix
Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- File: database/fix_clinics_rls_comprehensive.sql
```

This script will:
- Drop all existing conflicting policies
- Create new, properly configured policies
- Allow clinic owners to access their own data
- Allow public access to approved clinics

### Step 2: Run the Diagnostic Script
Execute the diagnostic script to check the current state:

```sql
-- Run this in Supabase SQL Editor
-- File: database/diagnose_clinic_access.sql
```

This will help identify:
- Current authenticated user
- Whether a clinic profile exists
- RLS policy status
- Any data inconsistencies

### Step 3: Check if Clinic Profile Exists
If the diagnostic shows "No clinic profile found", you need to create one:

1. **Check the clinic signup process** - ensure it's creating clinic profiles
2. **Manually create a clinic profile** if needed:

```sql
-- Only run this if the user doesn't have a clinic profile
INSERT INTO clinics (
    user_id,
    clinic_name,
    email,
    status,
    created_at,
    updated_at
) VALUES (
    'b3900f83-d64e-45e3-93e4-6bae15dde9ba', -- Replace with actual user ID
    'Your Clinic Name',
    'clinic@example.com',
    'pending',
    NOW(),
    NOW()
);
```

### Step 4: Verify User Role
Ensure the user has the correct role in their metadata:

```sql
-- Check user metadata (run in SQL Editor)
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'b3900f83-d64e-45e3-93e4-6bae15dde9ba';
```

The `raw_user_meta_data` should contain:
```json
{
  "role": "clinic",
  "clinic_name": "Your Clinic Name"
}
```

### Step 5: Test the Fix
After running the fixes:

1. **Sign out** and **sign back in** as the clinic user
2. **Navigate to the clinic dashboard**
3. **Check the browser console** for any remaining errors
4. **Verify that clinic settings load properly**

## 🔧 Enhanced Error Handling

The clinic service has been updated with better error handling:

- **406 Error**: Now provides clear guidance about RLS policies
- **Missing Profile**: Suggests completing registration
- **Authentication Issues**: Clear error messages for debugging

## 📋 Troubleshooting Checklist

- [ ] RLS policies updated with comprehensive fix
- [ ] User has correct role metadata (`"role": "clinic"`)
- [ ] Clinic profile exists in database
- [ ] User ID matches clinic's user_id
- [ ] User is properly authenticated
- [ ] No conflicting policies exist

## 🚀 Quick Fix Commands

### Option 1: Reset All RLS Policies
```sql
-- Drop all policies and recreate them
DROP POLICY IF EXISTS "Clinic owners can manage their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics can view their own profile" ON clinics;
DROP POLICY IF EXISTS "Anyone can view active clinics" ON clinics;
DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;

-- Create simple, permissive policy for testing
CREATE POLICY "Allow all authenticated users" ON clinics
    FOR ALL USING (auth.role() = 'authenticated');
```

### Option 2: Disable RLS Temporarily (for testing only)
```sql
-- WARNING: Only use for testing, disable in production
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
```

## 📞 Support Information

If the issue persists after following these steps:

1. **Check the browser console** for detailed error messages
2. **Run the diagnostic script** and share the results
3. **Verify the user ID** matches between auth and clinics table
4. **Check Supabase logs** for additional error details

## 🎯 Expected Outcome

After applying these fixes:
- ✅ Clinic dashboard loads without 406 errors
- ✅ Clinic settings page displays properly
- ✅ User can view and edit their clinic profile
- ✅ No more "Not Acceptable" errors in console 