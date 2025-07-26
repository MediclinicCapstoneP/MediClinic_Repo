# Backend Setup Guide for iGabayAtiCare

## 🚀 Quick Start

### 1. Supabase Project Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API

### 2. Environment Variables
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script

### 4. Authentication Configuration
1. Go to Authentication > Settings in your Supabase dashboard
2. Set your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs:
   - `http://localhost:5173/signin`
   - `http://localhost:5173/signup`
   - `http://localhost:5173/patient/dashboard`
   - `http://localhost:5173/clinic/dashboard`

## 🔧 What's Been Implemented

### ✅ Patient Signup Backend
- **Real Supabase Authentication** - No more simulated API calls
- **Patient Profile Creation** - Automatically creates patient records
- **Email Verification** - Users receive confirmation emails
- **Proper Error Handling** - Real error messages from Supabase
- **Form Validation** - Client-side and server-side validation

### ✅ Database Schema
- **Patients Table** - Stores patient profiles and medical info
- **Clinics Table** - Stores clinic information and business details
- **Appointments Table** - Manages patient-clinic appointments
- **Row Level Security** - Ensures data privacy and security
- **Indexes** - Optimized for performance

### ✅ Authentication Service
- **Sign Up** - Creates user account and patient profile
- **Sign In** - Authenticates users with proper error handling
- **Sign Out** - Logs out users securely
- **Password Reset** - Email-based password recovery
- **Profile Updates** - Update user metadata

### ✅ Patient Service
- **CRUD Operations** - Create, read, update, delete patient profiles
- **Type Safety** - Full TypeScript interfaces
- **Error Handling** - Comprehensive error management
- **Security** - RLS policies ensure data privacy

## 🧪 Testing the Backend

### Test Patient Registration
1. Start your development server: `npm run dev`
2. Go to `/signup` and create a new patient account
3. Check your email for verification
4. Verify in Supabase dashboard:
   - Authentication > Users (should see new user)
   - Table Editor > patients (should see new patient profile)

### Test Patient Sign In
1. Go to `/signin`
2. Use the credentials from the registration
3. Should redirect to `/patient/dashboard`

### Test Database Security
1. Try to access patient data from different accounts
2. Verify that users can only see their own data
3. Check that RLS policies are working correctly

## 🔒 Security Features

### Row Level Security (RLS)
- Patients can only access their own profiles
- Clinics can only access their own data
- Appointments are properly secured
- No unauthorized data access possible

### Authentication
- Email verification required
- Secure password handling
- JWT-based sessions
- Automatic session management

### Data Validation
- Client-side validation for UX
- Server-side validation for security
- Type safety with TypeScript
- Input sanitization

## 📊 Database Tables

### `patients` Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- first_name (TEXT, Required)
- last_name (TEXT, Required)
- email (TEXT, Required, Unique)
- phone (TEXT, Optional)
- date_of_birth (DATE, Optional)
- address (TEXT, Optional)
- emergency_contact (TEXT, Optional)
- blood_type (TEXT, Optional)
- allergies (TEXT, Optional)
- medications (TEXT, Optional)
- medical_conditions (TEXT, Optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `clinics` Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- clinic_name (TEXT, Required)
- email (TEXT, Required, Unique)
- phone (TEXT, Optional)
- website (TEXT, Optional)
- address (TEXT, Optional)
- city (TEXT, Optional)
- state (TEXT, Optional)
- zip_code (TEXT, Optional)
- license_number (TEXT, Optional)
- accreditation (TEXT, Optional)
- tax_id (TEXT, Optional)
- year_established (INTEGER, Optional)
- specialties (TEXT[], Optional)
- custom_specialties (TEXT[], Optional)
- services (TEXT[], Optional)
- custom_services (TEXT[], Optional)
- operating_hours (JSONB, Optional)
- number_of_doctors (INTEGER, Optional)
- number_of_staff (INTEGER, Optional)
- description (TEXT, Optional)
- status (TEXT, Default: 'pending')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `appointments` Table
```sql
- id (UUID, Primary Key)
- patient_id (UUID, Foreign Key to patients)
- clinic_id (UUID, Foreign Key to clinics)
- doctor_name (TEXT, Optional)
- appointment_date (DATE, Required)
- appointment_time (TIME, Required)
- appointment_type (TEXT, Optional)
- status (TEXT, Default: 'scheduled')
- notes (TEXT, Optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🚨 Troubleshooting

### Common Issues

**1. "Invalid API key" error**
- Check your `.env` file has correct Supabase URL and anon key
- Ensure the environment variables are prefixed with `VITE_`

**2. "Table does not exist" error**
- Run the SQL schema in Supabase SQL Editor
- Check that all tables were created successfully

**3. "RLS policy violation" error**
- Ensure you're signed in with a valid user account
- Check that the user has the correct role (patient/clinic)

**4. Email verification not working**
- Check Supabase Authentication settings
- Verify email templates are configured
- Check spam folder for verification emails

### Getting Help
1. Check Supabase dashboard logs
2. Verify environment variables
3. Test with a fresh user account
4. Check browser console for errors

## 🔄 Next Steps

### For Clinic Backend
- Implement clinic registration with document upload
- Add clinic approval workflow
- Create clinic dashboard with patient management

### For Appointments
- Implement appointment booking system
- Add calendar integration
- Create notification system

### For Enhanced Security
- Add two-factor authentication
- Implement audit logging
- Add data encryption for sensitive fields 