-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create patients table
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  date_of_birth date,
  address text,
  emergency_contact text,
  blood_type text,
  allergies text,
  medications text,
  medical_conditions text,
  profile_picture_url text,
  profile_picture_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);

-- Create clinics table
CREATE TABLE public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  website text,
  address text,
  city text,
  state text,
  zip_code text,
  license_number text,
  accreditation text,
  tax_id text,
  year_established integer,
  specialties text[],
  custom_specialties text[],
  services text[],
  custom_services text[],
  operating_hours jsonb,
  number_of_doctors integer,
  number_of_staff integer,
  description text,
  profile_picture_url text,
  profile_picture_path text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_name TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_clinics_user_id ON clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patients table
CREATE POLICY "Patients can view own profile" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own profile" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own profile" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for clinics table
CREATE POLICY "Clinics can view own profile" ON clinics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clinics can update own profile" ON clinics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Clinics can insert own profile" ON clinics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for appointments table
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can view appointments for their clinic" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can update appointments for their clinic" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

-- Add to your schema.sql
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id); 