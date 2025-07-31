# Clinic Signup Troubleshooting Guide

This guide helps identify and fix common issues with clinic registration in the IgabayCare application.

## 🔍 **Common Issues & Solutions**

### 1. **Database Schema Issues**

#### **Problem**: Syntax errors in clinics table
```sql
-- Check for syntax errors
SELECT * FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public';
```

#### **Solution**: Run the fix script
```sql
-- Execute the fix script
\i database/fix_clinic_signup.sql
```

### 2. **RLS (Row Level Security) Issues**

#### **Problem**: "Permission denied" errors
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';
```

#### **Solution**: Recreate RLS policies
```sql
-- Drop and recreate policies
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;

CREATE POLICY "Clinics can view own profile" ON clinics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clinics can update own profile" ON clinics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Clinics can insert own profile" ON clinics
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. **Authentication Issues**

#### **Problem**: User not authenticated during signup
```javascript
// Check if user is authenticated
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
```

#### **Solution**: Ensure proper auth flow
```javascript
// Make sure to wait for auth session
const { data: { session }, error } = await supabase.auth.getSession();
if (!session) {
  console.error('No active session');
  return;
}
```

### 4. **Form Validation Issues**

#### **Problem**: Form data not being saved properly
```javascript
// Check localStorage
const savedData = localStorage.getItem('clinicSignUpData');
console.log('Saved form data:', savedData);
```

#### **Solution**: Validate form data
```javascript
// Add validation before submission
if (!formData.clinic_name || !formData.email || !formData.password) {
  setError('Please fill in all required fields');
  return;
}
```

### 5. **Network/API Issues**

#### **Problem**: Supabase connection errors
```javascript
// Test Supabase connection
const { data, error } = await supabase
  .from('clinics')
  .select('count')
  .limit(1);

if (error) {
  console.error('Supabase connection error:', error);
}
```

#### **Solution**: Check environment variables
```javascript
// Verify Supabase URL and key
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## 🛠️ **Step-by-Step Fix Process**

### **Step 1: Run Database Fixes**
```bash
# Execute the fix script in Supabase SQL editor
\i database/fix_clinic_signup.sql
```

### **Step 2: Clear Browser Data**
```javascript
// Clear localStorage
localStorage.removeItem('clinicSignUpData');

// Clear session storage
sessionStorage.clear();
```

### **Step 3: Test Database Connection**
```sql
-- Test basic query
SELECT COUNT(*) FROM clinics;

-- Test RLS policies
SELECT * FROM clinics WHERE user_id = auth.uid();
```

### **Step 4: Verify Form Component**
```typescript
// Check if form component is receiving props correctly
console.log('Form props:', { onSuccess });

// Test form submission
const testSubmission = async () => {
  const result = await roleBasedAuthService.clinic.signUp({
    clinic_name: 'Test Clinic',
    email: 'test@clinic.com',
    password: 'testpassword123'
  });
  console.log('Signup result:', result);
};
```

## 🔧 **Debugging Tools**

### **1. Browser Console Debugging**
```javascript
// Add to clinic signup form
console.log('Form data:', formData);
console.log('Current step:', currentStep);
console.log('Loading state:', isLoading);
console.log('Error state:', error);
```

### **2. Network Tab Analysis**
- Open browser DevTools
- Go to Network tab
- Submit clinic signup form
- Check for failed requests
- Look for CORS errors

### **3. Supabase Logs**
```sql
-- Check recent auth events
SELECT * FROM auth.users 
WHERE email LIKE '%clinic%' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check clinic insertions
SELECT * FROM clinics 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📋 **Checklist for Clinic Signup**

### **Pre-Signup Checks**
- [ ] Supabase project is active
- [ ] Environment variables are set correctly
- [ ] Database schema is up to date
- [ ] RLS policies are configured
- [ ] User is not already authenticated

### **During Signup Checks**
- [ ] Form validation passes
- [ ] Password requirements are met
- [ ] Email format is valid
- [ ] Required fields are filled
- [ ] No JavaScript errors in console

### **Post-Signup Checks**
- [ ] User is created in auth.users
- [ ] Clinic profile is created in clinics table
- [ ] Email verification is sent
- [ ] User is redirected correctly
- [ ] Success message is displayed

## 🚨 **Common Error Messages & Solutions**

### **"Invalid email format"**
```sql
-- Check email validation trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'validate_clinic_data_trigger';
```

### **"Clinic name cannot be empty"**
```javascript
// Ensure clinic_name is not empty
if (!formData.clinic_name.trim()) {
  setError('Clinic name is required');
  return;
}
```

### **"Permission denied"**
```sql
-- Check user permissions
SELECT * FROM pg_roles WHERE rolname = 'authenticated';
GRANT SELECT, INSERT, UPDATE, DELETE ON clinics TO authenticated;
```

### **"Duplicate key value violates unique constraint"**
```sql
-- Check for existing clinic
SELECT * FROM clinics WHERE email = 'test@clinic.com';
DELETE FROM clinics WHERE email = 'test@clinic.com';
```

## 🔄 **Testing Process**

### **1. Test with Minimal Data**
```javascript
const minimalClinicData = {
  clinic_name: 'Test Clinic',
  email: 'test@clinic.com',
  password: 'testpassword123'
};
```

### **2. Test with Full Data**
```javascript
const fullClinicData = {
  clinic_name: 'Comprehensive Test Clinic',
  email: 'comprehensive@clinic.com',
  password: 'testpassword123',
  phone: '+1234567890',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TS',
  zip_code: '12345',
  specialties: ['Cardiology', 'Dermatology'],
  services: ['General Consultation', 'Vaccination']
};
```

### **3. Test Error Scenarios**
- Invalid email format
- Weak password
- Missing required fields
- Duplicate email
- Network timeout

## 📞 **Support Information**

### **If Issues Persist**
1. **Check Supabase Dashboard**
   - Go to Authentication > Users
   - Check for failed signups
   - Review error logs

2. **Check Database Logs**
   - Go to SQL Editor
   - Run diagnostic queries
   - Check for constraint violations

3. **Check Application Logs**
   - Open browser console
   - Look for JavaScript errors
   - Check network requests

### **Contact Information**
- **Database Issues**: Check Supabase documentation
- **Frontend Issues**: Review React/TypeScript errors
- **Authentication Issues**: Verify Supabase auth settings

## ✅ **Success Indicators**

When clinic signup is working correctly, you should see:

1. **Form Submission**: No console errors
2. **Database Insert**: Clinic record created in `clinics` table
3. **Auth User**: User created in `auth.users` table
4. **Email Verification**: Verification email sent
5. **Success Page**: Redirect to success page
6. **Session**: User session established

## 🎯 **Quick Fix Commands**

```bash
# 1. Run database fixes
psql -d your_database -f database/fix_clinic_signup.sql

# 2. Clear browser cache
# In browser: Ctrl+Shift+Delete

# 3. Restart development server
npm run dev

# 4. Test signup flow
# Navigate to /clinic-signup and test registration
```

This troubleshooting guide should help resolve most clinic signup issues. If problems persist, check the specific error messages and refer to the relevant sections above. 