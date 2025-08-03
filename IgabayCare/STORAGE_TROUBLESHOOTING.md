# Storage Bucket Access Troubleshooting Guide

## 🚨 **Issue: "No suitable storage bucket found. Available buckets: []"**

### **Root Cause Analysis**

The error occurs because your Supabase storage bucket exists but the application cannot access it due to missing or incorrect Row Level Security (RLS) policies.

### **🔧 Quick Fix Steps**

#### **Step 1: Run the Storage Setup Script**

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/fix_storage_policies.sql`
4. Click **Run** to execute the script

#### **Step 2: Verify Bucket Configuration**

After running the script, verify in your Supabase Dashboard:

1. Go to **Storage** → **Buckets**
2. Ensure `user-uploads` bucket exists and is **Public**
3. Check that the bucket has proper permissions

#### **Step 3: Test the Fix**

1. Refresh your application
2. Try uploading a profile picture
3. Check the browser console for any remaining errors

### **🔍 Detailed Diagnosis**

#### **Check 1: Environment Variables**
```javascript
// In browser console, run:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**Expected Result:** Both should be set and not empty.

#### **Check 2: Bucket Listing**
```javascript
// In browser console, run:
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
console.log('Error:', error);
```

**Expected Result:** Should show `user-uploads` bucket in the list.

#### **Check 3: Authentication Status**
```javascript
// In browser console, run:
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

**Expected Result:** Should show authenticated user.

#### **Check 4: Storage Policies**
```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
```

**Expected Result:** Should show 5 policies for storage.objects.

### **🛠️ Manual Setup (If Script Doesn't Work)**

#### **1. Create Bucket Manually**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

#### **2. Enable RLS**
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### **3. Create Basic Policies**
```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-uploads');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their files
CREATE POLICY "User updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to delete their files
CREATE POLICY "User deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);
```

### **🔧 Advanced Troubleshooting**

#### **Issue 1: Bucket Not Found**
**Symptoms:** `user-uploads` bucket doesn't appear in list
**Solution:**
1. Create bucket manually in Supabase Dashboard
2. Set bucket to **Public**
3. Add allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

#### **Issue 2: Permission Denied**
**Symptoms:** Bucket exists but upload fails with permission error
**Solution:**
1. Check RLS policies are properly set
2. Verify user is authenticated
3. Check bucket is set to public

#### **Issue 3: File Path Issues**
**Symptoms:** Upload succeeds but file path is incorrect
**Solution:**
1. Check file path format: `profile-pictures/{userType}/{userId}_{timestamp}.{extension}`
2. Verify user ID is being passed correctly

#### **Issue 4: CORS Errors**
**Symptoms:** Network errors in browser console
**Solution:**
1. Check Supabase project settings
2. Verify domain is allowed in CORS settings
3. Check if using correct Supabase URL

### **🧪 Testing the Fix**

#### **Test 1: Basic Upload**
```javascript
// Test in browser console
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const result = await storageService.uploadProfilePicture(
  'test-user-id',
  testFile,
  'patient'
);
console.log('Upload result:', result);
```

#### **Test 2: Profile Picture Component**
1. Navigate to a profile page
2. Click the upload button
3. Select an image file
4. Verify upload completes without errors

#### **Test 3: Storage Debug Button**
1. Click the debug button (🐛) in the ProfilePicture component
2. Check console for detailed storage test results
3. Verify all tests pass

### **📋 Verification Checklist**

- [ ] `user-uploads` bucket exists in Supabase
- [ ] Bucket is set to **Public**
- [ ] RLS policies are created and active
- [ ] User is authenticated
- [ ] Environment variables are set
- [ ] No CORS errors in console
- [ ] Upload test passes
- [ ] Profile picture displays correctly

### **🚨 Common Error Messages & Solutions**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `No suitable storage bucket found` | Bucket doesn't exist or not accessible | Run storage setup script |
| `Permission denied` | Missing RLS policies | Create storage policies |
| `Bucket not found` | Bucket name mismatch | Check bucket ID is `user-uploads` |
| `File too large` | File size exceeds limit | Reduce file size or increase limit |
| `Invalid file type` | Unsupported MIME type | Use JPEG, PNG, GIF, or WebP |
| `Authentication required` | User not logged in | Ensure user is authenticated |

### **📞 Getting Help**

If the issue persists after following these steps:

1. **Check Supabase Logs:** Go to Dashboard → Logs
2. **Test Storage Access:** Use the debug button in ProfilePicture component
3. **Verify Environment:** Ensure all environment variables are set
4. **Check Network:** Look for CORS or network errors in browser console

### **🔗 Related Files**

- `database/fix_storage_policies.sql` - Storage setup script
- `src/features/auth/utils/storageService.ts` - Storage service
- `src/components/ui/ProfilePicture.tsx` - Profile picture component
- `src/utils/testStorage.ts` - Storage testing utility

---

**💡 Pro Tip:** The storage setup script (`fix_storage_policies.sql`) should resolve most storage access issues. If problems persist, check the Supabase Dashboard for any error messages or policy conflicts. 