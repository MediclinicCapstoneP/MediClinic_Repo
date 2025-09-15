-- ==============================================
-- FIXED: ENHANCED DOCTOR FEATURES SCHEMA (Postgres / Supabase)
-- HANDLES EXISTING CHECK CONSTRAINTS PROPERLY
-- Run this as a single script in Supabase SQL editor
-- ==============================================

-- 0. Helper: ensure extension gen_random_uuid is available (Supabase typically has it)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0a. Create doctors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID,
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Professional Information
    medical_license_number TEXT,
    specialization TEXT[] DEFAULT '{}',
    sub_specialization TEXT[],
    years_of_experience INTEGER,
    education TEXT[],
    certifications TEXT[],
    
    -- Practice Information
    consultation_fee DECIMAL(10,2),
    currency TEXT DEFAULT 'PHP',
    consultation_duration INTEGER DEFAULT 30, -- minutes
    
    -- Schedule & Availability
    working_hours JSONB,
    available_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
    
    -- Profile & Documents
    profile_pic_url TEXT,
    cv_document_url TEXT,
    license_document_url TEXT,
    certification_documents TEXT[],
    
    -- Verification
    license_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Performance Metrics
    total_consultations INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Create doctor_patient_records table
CREATE TABLE IF NOT EXISTS public.doctor_patient_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  first_encounter_date DATE NOT NULL,
  last_appointment_date DATE,
  total_appointments INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  active_prescriptions INTEGER DEFAULT 0,
  medical_notes TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  family_history TEXT,
  lifestyle_notes TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  high_priority BOOLEAN DEFAULT FALSE,
  requires_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_doctor_patient_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_patient_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT unique_doctor_patient_record UNIQUE (doctor_id, patient_id)
);

-- 2. Enhance prescriptions table: add columns if missing
DO $$
BEGIN
  -- Add columns only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'doctor_id') THEN
    ALTER TABLE prescriptions ADD COLUMN doctor_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'appointment_id') THEN
    ALTER TABLE prescriptions ADD COLUMN appointment_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'diagnosis') THEN
    ALTER TABLE prescriptions ADD COLUMN diagnosis TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'follow_up_required') THEN
    ALTER TABLE prescriptions ADD COLUMN follow_up_required BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'follow_up_date') THEN
    ALTER TABLE prescriptions ADD COLUMN follow_up_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'pharmacy_notes') THEN
    ALTER TABLE prescriptions ADD COLUMN pharmacy_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'is_controlled_substance') THEN
    ALTER TABLE prescriptions ADD COLUMN is_controlled_substance BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'refill_allowed') THEN
    ALTER TABLE prescriptions ADD COLUMN refill_allowed BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'max_refills') THEN
    ALTER TABLE prescriptions ADD COLUMN max_refills INTEGER DEFAULT 3;
  END IF;
END $$;

-- 2.a Add foreign key constraints for prescriptions (drop if exists then add)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_prescriptions_doctor'
      AND conrelid = 'prescriptions'::regclass
  ) THEN
    ALTER TABLE prescriptions DROP CONSTRAINT fk_prescriptions_doctor;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_prescriptions_appointment'
      AND conrelid = 'prescriptions'::regclass
  ) THEN
    ALTER TABLE prescriptions DROP CONSTRAINT fk_prescriptions_appointment;
  END IF;
END $$;

-- Add constraints (will error if referenced tables/columns missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
    ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Handle clinic_services table properly (check constraints issue)
DO $$
BEGIN
  -- If table exists, we need to handle existing check constraints carefully
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_services') THEN
    
    -- First, drop ALL existing check constraints on service_category
    DECLARE
      constraint_record RECORD;
    BEGIN
      FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'clinic_services'::regclass 
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%service_category%'
      LOOP
        EXECUTE 'ALTER TABLE clinic_services DROP CONSTRAINT ' || constraint_record.conname;
      END LOOP;
    END;
    
    -- Now safely update any problematic service_category values
    UPDATE clinic_services
    SET service_category = CASE 
      WHEN service_category IS NULL OR TRIM(service_category) = '' THEN 'Other'
      WHEN service_category NOT IN ('Consultation', 'Therapy', 'Laboratory', 'Surgery', 'Dental', 'Other') THEN 'Other'
      ELSE service_category
    END;
    
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE public.clinic_services (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      clinic_id UUID NOT NULL,
      service_name VARCHAR(255) NOT NULL,
      service_category VARCHAR(100),
      description TEXT,
      base_price DECIMAL(10,2) DEFAULT 0.00,
      duration_minutes INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT fk_clinic_services_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );
  END IF;
  
  -- Now add the clean constraint (after data is normalized)
  ALTER TABLE clinic_services
    ADD CONSTRAINT clinic_services_service_category_check
    CHECK (service_category IN ('Consultation', 'Therapy', 'Laboratory', 'Surgery', 'Dental', 'Other'));
    
END $$;

-- Indexes for clinic_services
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id ON clinic_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_services_category ON clinic_services(service_category);

-- 4. Create appointment_services table
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_appointment_services_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_services_service FOREIGN KEY (service_id) REFERENCES clinic_services(id) ON DELETE CASCADE,
  CONSTRAINT unique_appointment_service UNIQUE (appointment_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);

-- 5. Create doctor_availability table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  break_start_time TIME,
  break_end_time TIME,
  max_appointments INTEGER DEFAULT 20,
  appointment_duration INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_doctor_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT check_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT check_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_day ON doctor_availability(doctor_id, day_of_week);

-- 6. Create doctor_consultation_notes table
CREATE TABLE IF NOT EXISTS public.doctor_consultation_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  physical_examination TEXT,
  assessment_and_plan TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  temperature DECIMAL(4,1),
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  bmi DECIMAL(4,1),
  severity VARCHAR(20) DEFAULT 'normal',
  is_confidential BOOLEAN DEFAULT FALSE,
  note_type VARCHAR(50) DEFAULT 'consultation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_consultation_notes_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_notes_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_notes_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_patient ON doctor_consultation_notes(doctor_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment ON doctor_consultation_notes(appointment_id);

-- 7. Create doctor_profile_settings table
CREATE TABLE IF NOT EXISTS public.doctor_profile_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  prescription_alerts BOOLEAN DEFAULT TRUE,
  patient_message_alerts BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  time_format VARCHAR(20) DEFAULT '12h',
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light',
  auto_confirm_appointments BOOLEAN DEFAULT FALSE,
  require_patient_forms BOOLEAN DEFAULT FALSE,
  allow_online_booking BOOLEAN DEFAULT TRUE,
  consultation_buffer_minutes INTEGER DEFAULT 5,
  max_daily_appointments INTEGER DEFAULT 25,
  profile_visible BOOLEAN DEFAULT TRUE,
  show_specialization BOOLEAN DEFAULT TRUE,
  show_experience BOOLEAN DEFAULT TRUE,
  show_education BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_doctor_settings_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT unique_doctor_settings UNIQUE (doctor_id)
);

-- 8. Indexes for all doctor tables
CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_doctor_id ON doctor_patient_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_patient_id ON doctor_patient_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_active ON doctor_patient_records(doctor_id, is_active);

-- 9. Create generic update timestamp function and triggers (drop triggers if they exist)
CREATE OR REPLACE FUNCTION update_doctor_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- doctor_patient_records trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctor_patient_records_updated_at') THEN
    DROP TRIGGER update_doctor_patient_records_updated_at ON doctor_patient_records;
  END IF;
END $$;

CREATE TRIGGER update_doctor_patient_records_updated_at
  BEFORE UPDATE ON doctor_patient_records
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

-- doctor_availability trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctor_availability_updated_at') THEN
    DROP TRIGGER update_doctor_availability_updated_at ON doctor_availability;
  END IF;
END $$;

CREATE TRIGGER update_doctor_availability_updated_at
  BEFORE UPDATE ON doctor_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

-- doctor_consultation_notes trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_consultation_notes_updated_at') THEN
    DROP TRIGGER update_consultation_notes_updated_at ON doctor_consultation_notes;
  END IF;
END $$;

CREATE TRIGGER update_consultation_notes_updated_at
  BEFORE UPDATE ON doctor_consultation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

-- doctor_profile_settings trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctor_settings_updated_at') THEN
    DROP TRIGGER update_doctor_settings_updated_at ON doctor_profile_settings;
  END IF;
END $$;

CREATE TRIGGER update_doctor_settings_updated_at
  BEFORE UPDATE ON doctor_profile_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

-- 10. Sync doctor-patient relationship function (safe upsert)
CREATE OR REPLACE FUNCTION sync_doctor_patient_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if both doctor_id and patient_id present
  IF NEW.doctor_id IS NOT NULL AND NEW.patient_id IS NOT NULL THEN
    INSERT INTO doctor_patient_records (doctor_id, patient_id, first_encounter_date, last_appointment_date, total_appointments, updated_at, created_at)
    VALUES (NEW.doctor_id, NEW.patient_id, COALESCE(NEW.appointment_date, CURRENT_DATE), COALESCE(NEW.appointment_date, CURRENT_DATE), 1, NOW(), NOW())
    ON CONFLICT (doctor_id, patient_id) DO UPDATE
    SET
      last_appointment_date = COALESCE(NEW.appointment_date, EXCLUDED.last_appointment_date),
      total_appointments = doctor_patient_records.total_appointments + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to appointments table (after insert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'appointments') THEN
    -- drop trigger if present
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_doctor_patient_on_appointment') THEN
      DROP TRIGGER sync_doctor_patient_on_appointment ON appointments;
    END IF;

    CREATE TRIGGER sync_doctor_patient_on_appointment
      AFTER INSERT ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION sync_doctor_patient_relationship();
  END IF;
END $$;

-- 11. Default doctor settings for existing doctors
INSERT INTO doctor_profile_settings (doctor_id)
SELECT id FROM doctors
WHERE id NOT IN (SELECT doctor_id FROM doctor_profile_settings)
ON CONFLICT (doctor_id) DO NOTHING;

-- 12. Insert sample availability for existing doctors (Mon-Fri 09:00-17:00)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'doctors') THEN
    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, created_at, updated_at)
    SELECT d.id, gs.day_of_week, '09:00:00'::time, '17:00:00'::time, NOW(), NOW()
    FROM doctors d
    CROSS JOIN LATERAL (SELECT generate_series(1,5) AS day_of_week) gs
    WHERE d.id NOT IN (SELECT DISTINCT doctor_id FROM doctor_availability)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 13. Comments for docs
COMMENT ON TABLE doctor_patient_records IS 'Tracks doctor-patient relationships and medical history';
COMMENT ON TABLE doctor_availability IS 'Doctor schedule and availability settings';
COMMENT ON TABLE doctor_consultation_notes IS 'Clinical notes and patient consultation records';
COMMENT ON TABLE doctor_profile_settings IS 'Doctor preferences and profile settings';

-- 14. Create view for doctor dashboard stats (uses appointments table)
-- Handle different doctor table structures dynamically
DO $$
DECLARE
  doctor_name_sql TEXT;
BEGIN
  -- Check which name columns exist in doctors table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'doctors' AND column_name = 'full_name'
  ) THEN
    -- Use full_name if it exists
    doctor_name_sql := 'd.full_name';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'doctors' AND column_name = 'first_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'doctors' AND column_name = 'last_name'
  ) THEN
    -- Use first_name + last_name if they exist
    doctor_name_sql := '(d.first_name || '' '' || d.last_name)';
  ELSE
    -- Fallback to 'Unknown Doctor'
    doctor_name_sql := '''Unknown Doctor''';
  END IF;

  -- Create the view with dynamic name column
  EXECUTE format('
    CREATE OR REPLACE VIEW doctor_dashboard_stats AS
    SELECT
      d.id AS doctor_id,
      %s AS doctor_name,
      d.specialization,
      COUNT(a.id) FILTER (WHERE a.id IS NOT NULL) AS total_appointments,
      COUNT(a.id) FILTER (WHERE a.status = ''completed'') AS completed_appointments,
      COUNT(a.id) FILTER (WHERE a.status IN (''assigned'', ''confirmed'')) AS upcoming_appointments,
      COUNT(a.id) FILTER (WHERE a.appointment_date = CURRENT_DATE) AS todays_appointments,
      COUNT(DISTINCT a.patient_id) AS total_patients,
      COUNT(DISTINCT dpr.patient_id) FILTER (WHERE dpr.is_active = TRUE) AS active_patients,
      COUNT(DISTINCT p.id) AS total_prescriptions,
      COUNT(p.id) FILTER (WHERE p.status = ''active'') AS active_prescriptions,
      MAX(a.appointment_date) AS last_appointment_date,
      MAX(GREATEST(COALESCE(a.updated_at, a.created_at), COALESCE(p.updated_at, p.created_at))) AS last_activity
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id
    LEFT JOIN doctor_patient_records dpr ON d.id = dpr.doctor_id AND dpr.is_active = TRUE
    LEFT JOIN prescriptions p ON d.id = p.doctor_id
    GROUP BY d.id, %s, d.specialization
  ', doctor_name_sql, doctor_name_sql);
  
END $$;

-- 15. Safe index for prescriptions (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'prescribed_date'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_date ON prescriptions(doctor_id, prescribed_date)';
  ELSE
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id)';
  END IF;
END $$;

-- 16. Final verification queries (result sets)
SELECT 'Enhanced doctor schema created successfully! ✅' AS message;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'doctor_%'
ORDER BY table_name;