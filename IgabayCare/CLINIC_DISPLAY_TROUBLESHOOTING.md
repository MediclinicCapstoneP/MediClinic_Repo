# Clinic Display Troubleshooting Guide

## Problem: No Clinics Displaying on Patient Home Page

The patient home page shows "No clinics available" even though the app is connecting to Supabase successfully.

## 🔍 Step-by-Step Solution

### Step 1: Check Current Database State

Run this in your **Supabase SQL Editor**:

```sql
-- Check if any clinics exist
SELECT COUNT(*) as total_clinics FROM clinics;

-- Check clinics by status
SELECT status, COUNT(*) as count 
FROM clinics 
GROUP BY status;

-- Check if any approved clinics exist
SELECT * FROM clinics WHERE status = 'approved';
```

### Step 2: Add Test Clinics

If no clinics exist or none are approved, run this script:

```sql
-- Add a test clinic
INSERT INTO clinics (
    id,
    user_id,
    clinic_name,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    number_of_doctors,
    year_established,
    description,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Rex Medical Clinic',
    'rexloverem@gmail.com',
    '+1234567890',
    '123 Medical Center Dr',
    'Your City',
    'Your State',
    '12345',
    3,
    2020,
    'A comprehensive medical clinic providing quality healthcare services to our community.',
    'approved',
    NOW(),
    NOW()
);
```

### Step 3: Fix RLS Policies

If clinics exist but still don't show, run this to fix RLS:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view approved clinics" ON clinics;

-- Create new policy for public read access
CREATE POLICY "Public can view approved clinics" ON clinics
    FOR SELECT
    USING (status = 'approved');

-- Create policy for clinic owners
CREATE POLICY "Clinic owners can manage their clinics" ON clinics
    FOR ALL
    USING (auth.uid() = user_id);
```

### Step 4: Verify the Fix

After running the above scripts, check:

```sql
-- Should show approved clinics
SELECT 
    clinic_name,
    email,
    status,
    created_at
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC;
```

### Step 5: Test in Browser

1. **Refresh** the patient home page
2. **Open browser dev tools** (F12)
3. **Check console** for any error messages
4. **Look for** the debug info showing "Clinics found: X"

## 🚨 Common Issues & Solutions

### Issue 1: "No clinics found"
**Solution:** Run the test clinic insertion script above

### Issue 2: "403 Forbidden" error
**Solution:** Run the RLS policy fix script above

### Issue 3: "406 Not Acceptable" error  
**Solution:** Run the RLS policy fix script above

### Issue 4: Clinics exist but don't show
**Solution:** Check if clinics have `status = 'approved'`

## 📋 Quick Commands

### Add Multiple Test Clinics:
```sql
-- Use database/add_test_clinics.sql
```

### Fix RLS Only:
```sql
-- Use database/fix_clinics_public_read.sql
```

### Check Database State:
```sql
-- Use database/check_clinics_data.sql
```

## 🔧 Manual Steps

1. **Go to Supabase Dashboard**
2. **Open SQL Editor**
3. **Run the scripts above in order**
4. **Refresh your app**
5. **Check the debug info on patient home page**

## ✅ Expected Result

After running the scripts, you should see:
- Debug info showing "Clinics found: 1" (or more)
- "Source: Supabase" 
- Clinic cards displaying with:
  - Clinic name
  - Address
  - Number of doctors
  - Specialties (if added)

## 🆘 Still Not Working?

If the issue persists:

1. **Check browser console** for JavaScript errors
2. **Verify Supabase connection** in your app
3. **Check if RLS is enabled** on the clinics table
4. **Ensure you're logged in** as a patient user
5. **Try clearing browser cache** and refreshing

## 📞 Need Help?

If you're still having issues, check:
- Supabase project settings
- Network connectivity
- Browser console errors
- Authentication status

The most common cause is simply that no approved clinics exist in the database. Adding test clinics should resolve this immediately! 