# Authentication Issue Resolution Guide

## The Problem
You're experiencing "Invalid login credentials" errors for both patient and clinic sign-in. This is likely due to one of these issues:

1. **Missing Environment Variables** - Supabase configuration not set up
2. **No Test Users** - No users exist in the database to authenticate against
3. **Email Verification** - Users exist but emails aren't confirmed

## Step-by-Step Solution

### Step 1: Set Up Environment Variables

1. **Create a `.env` file** in your project root (next to package.json):
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```

2. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon key

3. **Update your `.env` file**:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Restart your development server** after creating/updating .env:
   ```bash
   npm run dev
   ```

### Step 2: Use the Debug Tool

1. **Open the debug page** in your browser:
   ```
   http://localhost:5173/debug
   ```

2. **Follow this sequence**:
   - Click "Check Connection" to verify Supabase setup
   - Click "Create Test Users" to create test accounts
   - Click "Test Sign-ins" to verify authentication works
   - Use "Show Credentials" to see the test login details

### Step 3: Test Authentication

**Test Credentials** (after creating test users):
- **Patient**: 
  - Email: `patient@test.com`
  - Password: `TestPassword123!`
- **Clinic**: 
  - Email: `clinic@test.com`
  - Password: `TestPassword123!`

### Step 4: Manual Testing

1. Go to the patient sign-in page: `http://localhost:5173/signin`
2. Use the test patient credentials
3. Go to the clinic sign-in page: `http://localhost:5173/clinic-signin`
4. Use the test clinic credentials

## Common Issues & Fixes

### Issue: "VITE_SUPABASE_URL is missing"
**Fix**: Create `.env` file with proper credentials (see Step 1)

### Issue: "Network Error" or "Failed to fetch"
**Fix**: Check your Supabase project is active and URL is correct

### Issue: "Email not confirmed"
**Fix**: The debug tool creates users with auto-confirmed emails

### Issue: Test user creation fails
**Fix**: Check your Supabase RLS (Row Level Security) policies

## Database Setup (if needed)

If test user creation still fails, you might need to check your Supabase:

1. **Tables exist**: patients, clinics, auth.users
2. **RLS policies** allow user creation and reading
3. **Auth settings** allow sign-ups

## Cleanup (Important!)

**Before deploying to production**:
1. Remove the debug route from `App.tsx`
2. Delete the debug components
3. Secure your environment variables

## Files Created for Debugging

- `src/utils/testDataService.ts` - Test user creation
- `src/components/debug/AuthDebugComponent.tsx` - Debug interface
- `src/pages/DebugPage.tsx` - Debug page
- `src/utils/envChecker.ts` - Environment validation
- `.env.example` - Environment template

Remember to remove these debug files before production deployment!