# Doctor Authentication System Setup Guide

## Overview
This system allows clinics to create doctor accounts with login credentials. Doctors can then sign in to access their clinic dashboard and manage patient appointments.

## 1. Create the Doctors Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create doctors table with authentication
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    years_experience INTEGER,
    availability TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on-leave', 'inactive')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_patients INTEGER DEFAULT 0,
    profile_picture_url TEXT,
    profile_picture_path TEXT,
    -- Authentication fields
    username VARCHAR(100) UNIQUE,
    password_hash TEXT, -- For clinic-created accounts
    is_clinic_created BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Create Indexes for Performance

```sql
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_username ON doctors(username);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
```

## 3. Enable Row Level Security

```sql
-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
```

## 4. Create RLS Policies

```sql
-- Create RLS policies
-- Allow clinic owners to manage their doctors
CREATE POLICY "Clinic owners can manage their doctors" ON doctors
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM clinics WHERE user_id = auth.uid()
        )
    );

-- Allow doctors to view their own profile
CREATE POLICY "Doctors can view their own profile" ON doctors
    FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users to view active doctors (for patient search)
CREATE POLICY "Anyone can view active doctors" ON doctors
    FOR SELECT USING (status = 'active');

-- Allow doctors to update their own profile
CREATE POLICY "Doctors can update their own profile" ON doctors
    FOR UPDATE USING (user_id = auth.uid());
```

## 5. Create Helper Functions

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_doctors_updated_at();
```

## 6. Add Routes to App.tsx

Add the doctor sign-in route to your App.tsx:

```tsx
import { DoctorSignInPage } from './features/auth/pages/DoctorSignInPage';

// In your Routes component:
<Route path="/doctor-signin" element={<DoctorSignInPage />} />
```

## 7. Features Added

### **Clinic Management:**
✅ **Add Doctor Accounts** - Clinics can create doctor accounts with login credentials
✅ **Username/Password** - Optional username, required email/password
✅ **Password Validation** - Minimum 6 characters, confirmation required
✅ **Status Management** - Active, on-leave, inactive status tracking

### **Doctor Authentication:**
✅ **Doctor Sign-In Page** - Dedicated login page for doctors
✅ **Email/Password Login** - Secure authentication for clinic-created accounts
✅ **Session Management** - Stores doctor info in localStorage
✅ **Role-Based Access** - Doctors get 'doctor' role for dashboard access

### **Security Features:**
✅ **Password Hashing** - Passwords are hashed before storage
✅ **RLS Policies** - Row Level Security for data protection
✅ **Clinic Association** - Doctors are linked to their clinic
✅ **Status Filtering** - Only active doctors are visible to patients

## 8. How It Works

### **For Clinics:**
1. **Log in** to clinic dashboard
2. **Go to Doctors section**
3. **Click "Add Doctor"**
4. **Fill in doctor details** including:
   - Full name, specialization, email
   - License number, experience
   - Username (optional)
   - Password (required)
5. **Doctor account is created** with login credentials

### **For Doctors:**
1. **Visit** `/doctor-signin`
2. **Enter email and password** provided by clinic
3. **Sign in** to access doctor dashboard
4. **Manage appointments** and patient care

### **For Patients:**
1. **View active doctors** in clinic listings
2. **See doctor information** (name, specialization, experience)
3. **Book appointments** with available doctors

## 9. Database Schema

### **Key Fields:**
- `is_clinic_created` - Boolean flag for clinic-created accounts
- `password_hash` - Hashed password for authentication
- `username` - Optional username for login
- `email_verified` - Email verification status
- `last_login` - Timestamp of last login

### **Relationships:**
- `clinic_id` - Links doctor to clinic
- `user_id` - Links to auth.users (for future Supabase Auth integration)

## 10. Security Notes

⚠️ **Important:** The current password hashing uses SHA-256 for demonstration. In production, use:
- **bcrypt** or **Argon2** for password hashing
- **JWT tokens** for session management
- **HTTPS** for all communications
- **Rate limiting** for login attempts

## 11. Testing

1. **Create a clinic account** and log in
2. **Add a doctor** with email and password
3. **Visit** `/doctor-signin`
4. **Log in** with doctor credentials
5. **Verify** doctor dashboard access

The system is now ready for clinic-created doctor accounts with secure authentication! 🎉 