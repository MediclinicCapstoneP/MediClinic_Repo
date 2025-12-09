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

-- Create doctors table
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  specialization text,
  license_number text,
  years_experience integer,
  availability text,
  profile_picture_url text,
  profile_picture_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name TEXT,
    doctor_specialty TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation','follow_up','emergency','routine_checkup','specialist_visit','procedure','surgery','lab_test','imaging','vaccination','physical_therapy','mental_health','dental','vision','other')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    patient_name TEXT,
    patient_notes TEXT,
    doctor_notes TEXT,
    admin_notes TEXT,
    notes TEXT,
    payment_amount DECIMAL(10,2),
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    copay_amount DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_clinics_user_id ON clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

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

-- Medical records table (for patient history) - unified for all roles
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NULL,
  doctor_id uuid NULL,
  clinic_id uuid NULL,
  record_type text NOT NULL CHECK (record_type IN ('consultation','lab_result','prescription','vaccination','surgery','imaging','other')),
  title text NOT NULL,
  description text NULL,
  diagnosis text NULL,
  treatment text NULL,
  prescription text NULL,
  lab_results jsonb NULL,
  vital_signs jsonb NULL,
  attachments text[] NULL,
  is_private boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  appointment_id uuid NULL,
  visit_date date NULL DEFAULT CURRENT_DATE,
  chief_complaint text NULL,
  CONSTRAINT medical_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
  CONSTRAINT medical_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics (id),
  CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors (id),
  CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    prescribed_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','expired','discontinued')),
    refills_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription medications (for multi-medication prescriptions)
CREATE TABLE IF NOT EXISTS prescription_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab results table
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_type TEXT,
    test_date DATE NOT NULL,
    result_value TEXT,
    normal_range TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','abnormal','critical')),
    notes TEXT,
    critical_values BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccination records table
CREATE TABLE IF NOT EXISTS vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT,
    manufacturer TEXT,
    lot_number TEXT,
    administration_date DATE NOT NULL,
    site_of_injection TEXT,
    next_due_date DATE,
    adverse_reactions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allergies table
CREATE TABLE IF NOT EXISTS allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    allergy_type TEXT CHECK (allergy_type IN ('drug','food','environmental','other')),
    severity TEXT CHECK (severity IN ('mild','moderate','severe')),
    reaction TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance info table
CREATE TABLE IF NOT EXISTS insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    subscriber_name TEXT,
    relationship_to_subscriber TEXT,
    coverage_type TEXT,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('appointment','prescription','medical','reminder','general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctors table
CREATE POLICY "Doctors can view own profile" ON doctors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile" ON doctors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own profile" ON doctors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for medical records
CREATE POLICY "Patients can view own medical records" ON medical_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = medical_records.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view medical records for their patients" ON medical_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = medical_records.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can view medical records for their clinic" ON medical_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = medical_records.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can create medical records for their patients" ON medical_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = medical_records.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can create medical records for their clinic" ON medical_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = medical_records.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update medical records they created" ON medical_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = medical_records.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can update medical records for their clinic" ON medical_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = medical_records.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- RLS policies for prescriptions
CREATE POLICY "Patients can view own prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = prescriptions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view prescriptions they issued" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

-- RLS policies for lab results
CREATE POLICY "Patients can view own lab results" ON lab_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = lab_results.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view lab results for their patients" ON lab_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = lab_results.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

-- RLS policies for vaccination records
CREATE POLICY "Patients can view own vaccination records" ON vaccination_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = vaccination_records.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view vaccination records for their patients" ON vaccination_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = vaccination_records.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

-- RLS policies for allergies
CREATE POLICY "Patients can view own allergies" ON allergies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = allergies.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view allergies for their patients" ON allergies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id IN (
                SELECT doctor_id FROM appointments 
                WHERE appointments.patient_id = allergies.patient_id
            )
            AND doctors.user_id = auth.uid()
        )
    );

-- RLS policies for insurance info
CREATE POLICY "Patients can view own insurance info" ON insurance_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = insurance_info.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- RLS policies for emergency contacts
CREATE POLICY "Patients can view own emergency contacts" ON emergency_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = emergency_contacts.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Additional indexes for history queries
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_date ON lab_results(test_date);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_patient_id ON vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_administration_date ON vaccination_records(administration_date);
CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_info_patient_id ON insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Triggers for updated_at on new tables
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccination_records_updated_at BEFORE UPDATE ON vaccination_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON allergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_info_updated_at BEFORE UPDATE ON insurance_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();