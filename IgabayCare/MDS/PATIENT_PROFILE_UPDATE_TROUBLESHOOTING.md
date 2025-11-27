# Patient Profile Update Troubleshooting Guide

This guide helps resolve the common error: `JSON object requested, multiple (or no) rows returned` when updating patient profiles.

## 🔍 **Root Cause Analysis**

### **The Problem:**
The error occurs when the `updatePatient` function tries to return a single row (`.single()`) but either:
1. **No rows are updated** - Patient doesn't exist or RLS blocks the update
2. **Multiple rows are returned** - Duplicate records or incorrect query

### **Common Causes:**
1. **Wrong ID passed** - Using `patient.id` instead of `patient.user_id`
2. **RLS Policy Issues** - Row Level Security blocking updates
3. **Missing Patient Record** - Patient profile doesn't exist
4. **Permission Issues** - User not authenticated or lacks permissions

## 🛠️ **Step-by-Step Fix Process**

### **Step 1: Fix the Code Issue (Already Done)**
```typescript
// ❌ WRONG - Using patient.id
const updatedData = await patientService.updatePatient(patientData.id, sanitizedData);

// ✅ CORRECT - Using patient.user_id
const updatedData = await patientService.updatePatient(patientData.user_id, sanitizedData);
```

### **Step 2: Run Database Fixes**
```sql
-- Execute this in your Supabase SQL editor
\i database/fix_patient_update.sql
```

### **Step 3: Verify Patient Exists**
```sql
-- Check if patient exists for the current user
SELECT * FROM patients WHERE user_id = auth.uid();
```

### **Step 4: Test RLS Policies**
```sql
-- Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'patients';
```

## 🔧 **Debugging Steps**

### **1. Check Browser Console**
```javascript
// Add this to PatientProfile.tsx for debugging
console.log('Patient data:', patientData);
console.log('User ID:', patientData.user_id);
console.log('Sanitized data:', sanitizedData);
```

### **2. Check Network Tab**
- Open browser DevTools
- Go to Network tab
- Try to update profile
- Look for failed requests
- Check response status codes

### **3. Check Supabase Logs**
```sql
-- Check recent patient updates
SELECT * FROM patients 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### **4. Test Authentication**
```javascript
// Add this to verify user authentication
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', error);
```

## 🚨 **Common Error Messages & Solutions**

### **"JSON object requested, multiple (or no) rows returned"**
**Cause**: No rows updated or multiple rows returned
**Solution**: 
1. Check if patient exists: `SELECT * FROM patients WHERE user_id = 'your-user-id'`
2. Verify RLS policies are correct
3. Ensure using correct user_id

### **"Permission denied"**
**Cause**: RLS policy blocking the update
**Solution**:
```sql
-- Recreate RLS policies
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
CREATE POLICY "Patients can update own profile" ON patients
    FOR UPDATE USING (auth.uid() = user_id);
```

### **"Patient profile not found"**
**Cause**: Patient record doesn't exist
**Solution**:
```sql
-- Create patient record if missing
INSERT INTO patients (user_id, first_name, last_name, email)
VALUES (auth.uid(), 'John', 'Doe', 'john@example.com');
```

### **"Invalid email format"**
**Cause**: Email validation trigger
**Solution**: Ensure email format is valid: `user@domain.com`

## 📋 **Testing Checklist**

### **Before Testing:**
- [ ] Run database fixes script
- [ ] Clear browser cache
- [ ] Check user authentication
- [ ] Verify patient record exists

### **During Testing:**
- [ ] Fill all required fields
- [ ] Use valid email format
- [ ] Check browser console for errors
- [ ] Monitor network requests

### **After Testing:**
- [ ] Verify profile updates in database
- [ ] Check if changes persist
- [ ] Test with different data
- [ ] Verify error handling

## 🔄 **Alternative Solutions**

### **Solution 1: Use Upsert Instead of Update**
```typescript
// In patientService.ts
async updatePatient(userId: string, updates: Partial<PatientProfile>) {
  const { data: patient, error } = await supabase
    .from('patients')
    .upsert([{ user_id: userId, ...updates }], { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  return { success: !error, error: error?.message, patient };
}
```

### **Solution 2: Use Database Function**
```sql
-- Create a safer update function
CREATE OR REPLACE FUNCTION safe_update_patient(
  user_uuid uuid,
  update_data jsonb
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE patients 
  SET 
    first_name = COALESCE(update_data->>'first_name', first_name),
    last_name = COALESCE(update_data->>'last_name', last_name),
    email = COALESCE(update_data->>'email', email),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  IF FOUND THEN
    SELECT to_jsonb(p.*) INTO result
    FROM patients p
    WHERE p.user_id = user_uuid;
    RETURN result;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ language 'plpgsql';
```

### **Solution 3: Enhanced Error Handling**
```typescript
// In patientService.ts
async updatePatient(userId: string, updates: Partial<PatientProfile>) {
  try {
    // First check if patient exists
    const existingPatient = await this.getPatientByUserId(userId);
    if (!existingPatient.success || !existingPatient.patient) {
      return { success: false, error: 'Patient profile not found' };
    }
    
    // Remove user_id from updates to avoid conflicts
    const { user_id, ...updateData } = updates;
    
    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (!patient) {
      return { success: false, error: 'No patient found after update' };
    }

    return { success: true, patient };
  } catch (error) {
    console.error('Exception:', error);
    return { success: false, error: 'Failed to update patient profile' };
  }
}
```

## 🎯 **Quick Fix Commands**

```bash
# 1. Run database fixes
psql -d your_database -f database/fix_patient_update.sql

# 2. Clear browser cache
# In browser: Ctrl+Shift+Delete

# 3. Restart development server
npm run dev

# 4. Test patient profile update
# Navigate to patient profile and try updating
```

## 📞 **If Issues Persist**

### **Check These Items:**
1. **Supabase Dashboard**
   - Go to Authentication > Users
   - Check if user exists and is confirmed
   - Verify user metadata

2. **Database Logs**
   - Go to SQL Editor
   - Run diagnostic queries
   - Check for constraint violations

3. **Application Logs**
   - Open browser console
   - Look for JavaScript errors
   - Check network requests

### **Contact Information:**
- **Database Issues**: Check Supabase documentation
- **Frontend Issues**: Review React/TypeScript errors
- **Authentication Issues**: Verify Supabase auth settings

## ✅ **Success Indicators**

When patient profile update is working correctly, you should see:

1. **No console errors** during update
2. **Successful network request** (200 status)
3. **Updated data** in the UI
4. **Persistent changes** after page refresh
5. **Updated timestamp** in database

## 🚀 **Prevention Tips**

1. **Always use `user_id`** instead of `id` for updates
2. **Test RLS policies** regularly
3. **Add proper error handling** in components
4. **Validate data** before sending to database
5. **Use upsert** for safer operations
6. **Monitor database logs** for issues

This troubleshooting guide should resolve the patient profile update issues! 🏥 