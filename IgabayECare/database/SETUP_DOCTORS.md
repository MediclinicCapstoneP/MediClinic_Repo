# Doctors Table Setup Guide

## 1. Create the Doctors Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create doctors table
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
```

## 3. Enable Row Level Security

```sql
-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
```

## 4. Create RLS Policies

```sql
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
```

## 5. Create Updated Timestamp Function

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

## 6. Test the Setup

After running all the SQL commands above, you can test the setup by:

1. Going to your Supabase Dashboard
2. Navigate to Table Editor
3. You should see the `doctors` table listed
4. The table should have all the columns defined above

## 7. Verify RLS Policies

In the Supabase Dashboard:
1. Go to Authentication > Policies
2. Find the `doctors` table
3. Verify that the three policies are created:
   - "Clinic owners can manage their doctors"
   - "Doctors can view their own profile"
   - "Anyone can view active doctors"

## Features Added

With this setup, your ClinicDoctors component now supports:

✅ **Real-time data**: Fetches doctors from Supabase database
✅ **Add new doctors**: Complete form with validation
✅ **Search and filter**: By name, specialization, and status
✅ **Status management**: Active, on-leave, inactive
✅ **Secure access**: Only clinic owners can manage their doctors
✅ **Professional fields**: License numbers, experience, availability
✅ **Responsive design**: Works on all screen sizes

## Usage

1. Log in as a clinic user
2. Navigate to the Doctors section in your clinic dashboard
3. Click "Add Doctor" to create new doctor profiles
4. Use search and filters to find specific doctors
5. View doctor details and manage their status

The doctors will be automatically associated with your clinic and only you (as the clinic owner) can manage them. 