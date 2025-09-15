-- 🚀 ENHANCED DOCTOR FEATURES SCHEMA
-- This SQL script creates all necessary tables and enhancements for complete doctor functionality

-- 1. Create doctor_patient_records table for comprehensive patient management
CREATE TABLE IF NOT EXISTS "public"."doctor_patient_records" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "first_encounter_date" DATE NOT NULL,
  "last_appointment_date" DATE,
  "total_appointments" INTEGER DEFAULT 0,
  "total_consultations" INTEGER DEFAULT 0,
  "active_prescriptions" INTEGER DEFAULT 0,
  
  -- Medical history fields
  "medical_notes" TEXT,
  "allergies" TEXT,
  "chronic_conditions" TEXT,
  "family_history" TEXT,
  "lifestyle_notes" TEXT,
  
  -- Emergency information
  "emergency_contact_name" VARCHAR(255),
  "emergency_contact_phone" VARCHAR(20),
  "emergency_contact_relation" VARCHAR(100),
  
  -- Status and flags
  "is_active" BOOLEAN DEFAULT TRUE,
  "high_priority" BOOLEAN DEFAULT FALSE,
  "requires_follow_up" BOOLEAN DEFAULT FALSE,
  "follow_up_date" DATE,
  "follow_up_notes" TEXT,
  
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_doctor_patient_records_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_patient_records_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    
  -- Unique constraint
  CONSTRAINT unique_doctor_patient_record 
    UNIQUE (doctor_id, patient_id)
);

-- 2. Enhance prescriptions table for better doctor workflow
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS doctor_id UUID,
ADD COLUMN IF NOT EXISTS appointment_id UUID,
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS pharmacy_notes TEXT,
ADD COLUMN IF NOT EXISTS is_controlled_substance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refill_allowed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS max_refills INTEGER DEFAULT 3;

-- Add foreign keys for prescriptions if they don't exist
ALTER TABLE prescriptions 
ADD CONSTRAINT IF NOT EXISTS fk_prescriptions_doctor 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
ADD CONSTRAINT IF NOT EXISTS fk_prescriptions_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- 3. Create doctor_availability table for schedule management
CREATE TABLE IF NOT EXISTS "public"."doctor_availability" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "doctor_id" UUID NOT NULL,
  "day_of_week" INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "is_available" BOOLEAN DEFAULT TRUE,
  "break_start_time" TIME,
  "break_end_time" TIME,
  "max_appointments" INTEGER DEFAULT 20,
  "appointment_duration" INTEGER DEFAULT 30, -- in minutes
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_doctor_availability_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    
  CONSTRAINT check_day_of_week 
    CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT check_times 
    CHECK (start_time < end_time)
);

-- 4. Create doctor_notes table for patient consultation notes
CREATE TABLE IF NOT EXISTS "public"."doctor_consultation_notes" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "appointment_id" UUID,
  
  -- Clinical notes
  "chief_complaint" TEXT,
  "history_of_present_illness" TEXT,
  "physical_examination" TEXT,
  "assessment_and_plan" TEXT,
  "diagnosis" TEXT,
  "treatment_plan" TEXT,
  "follow_up_instructions" TEXT,
  
  -- Vitals
  "blood_pressure" VARCHAR(20),
  "heart_rate" INTEGER,
  "temperature" DECIMAL(4,1),
  "respiratory_rate" INTEGER,
  "oxygen_saturation" INTEGER,
  "weight" DECIMAL(5,2),
  "height" DECIMAL(5,2),
  "bmi" DECIMAL(4,1),
  
  -- Additional fields
  "severity" VARCHAR(20) DEFAULT 'normal', -- normal, mild, moderate, severe, critical
  "is_confidential" BOOLEAN DEFAULT FALSE,
  "note_type" VARCHAR(50) DEFAULT 'consultation', -- consultation, follow_up, emergency, procedure
  
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_consultation_notes_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_notes_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_notes_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- 5. Create doctor_profile_settings table for preferences
CREATE TABLE IF NOT EXISTS "public"."doctor_profile_settings" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "doctor_id" UUID NOT NULL,
  
  -- Notification preferences
  "email_notifications" BOOLEAN DEFAULT TRUE,
  "sms_notifications" BOOLEAN DEFAULT FALSE,
  "appointment_reminders" BOOLEAN DEFAULT TRUE,
  "prescription_alerts" BOOLEAN DEFAULT TRUE,
  "patient_message_alerts" BOOLEAN DEFAULT TRUE,
  
  -- Display preferences
  "timezone" VARCHAR(50) DEFAULT 'UTC',
  "date_format" VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  "time_format" VARCHAR(20) DEFAULT '12h',
  "language" VARCHAR(10) DEFAULT 'en',
  "theme" VARCHAR(20) DEFAULT 'light',
  
  -- Professional preferences
  "auto_confirm_appointments" BOOLEAN DEFAULT FALSE,
  "require_patient_forms" BOOLEAN DEFAULT FALSE,
  "allow_online_booking" BOOLEAN DEFAULT TRUE,
  "consultation_buffer_minutes" INTEGER DEFAULT 5,
  "max_daily_appointments" INTEGER DEFAULT 25,
  
  -- Privacy settings
  "profile_visible" BOOLEAN DEFAULT TRUE,
  "show_specialization" BOOLEAN DEFAULT TRUE,
  "show_experience" BOOLEAN DEFAULT TRUE,
  "show_education" BOOLEAN DEFAULT TRUE,
  
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_doctor_settings_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT unique_doctor_settings 
    UNIQUE (doctor_id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_doctor_id 
  ON doctor_patient_records(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_patient_id 
  ON doctor_patient_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_doctor_patient_records_active 
  ON doctor_patient_records(doctor_id, is_active);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_day 
  ON doctor_availability(doctor_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_patient 
  ON doctor_consultation_notes(doctor_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment 
  ON doctor_consultation_notes(appointment_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_date 
  ON prescriptions(doctor_id, prescribed_date);

-- 7. Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_doctor_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_doctor_patient_records_updated_at
  BEFORE UPDATE ON doctor_patient_records
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

CREATE TRIGGER IF NOT EXISTS update_doctor_availability_updated_at
  BEFORE UPDATE ON doctor_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

CREATE TRIGGER IF NOT EXISTS update_consultation_notes_updated_at
  BEFORE UPDATE ON doctor_consultation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

CREATE TRIGGER IF NOT EXISTS update_doctor_settings_updated_at
  BEFORE UPDATE ON doctor_profile_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_tables_updated_at();

-- 8. Create function to automatically sync doctor-patient relationships
CREATE OR REPLACE FUNCTION sync_doctor_patient_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new doctor appointment is created, ensure doctor-patient relationship exists
  INSERT INTO doctor_patient_records (doctor_id, patient_id, first_encounter_date)
  VALUES (NEW.doctor_id, NEW.patient_id, NEW.appointment_date)
  ON CONFLICT (doctor_id, patient_id) DO UPDATE SET
    last_appointment_date = NEW.appointment_date,
    total_appointments = doctor_patient_records.total_appointments + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS sync_doctor_patient_on_appointment
  AFTER INSERT ON doctor_appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_doctor_patient_relationship();

-- 9. Create default doctor settings for existing doctors
INSERT INTO doctor_profile_settings (doctor_id)
SELECT id FROM doctors 
WHERE id NOT IN (SELECT doctor_id FROM doctor_profile_settings)
ON CONFLICT (doctor_id) DO NOTHING;

-- 10. Insert sample availability for existing doctors (weekdays 9-5)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
SELECT 
  d.id as doctor_id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00:00'::time as start_time,
  '17:00:00'::time as end_time
FROM doctors d
WHERE d.id NOT IN (SELECT DISTINCT doctor_id FROM doctor_availability)
ON CONFLICT DO NOTHING;

-- 11. Add comments for documentation
COMMENT ON TABLE doctor_patient_records IS 'Tracks doctor-patient relationships and medical history';
COMMENT ON TABLE doctor_availability IS 'Doctor schedule and availability settings';
COMMENT ON TABLE doctor_consultation_notes IS 'Clinical notes and patient consultation records';
COMMENT ON TABLE doctor_profile_settings IS 'Doctor preferences and profile settings';

-- 12. Create view for doctor dashboard statistics
CREATE OR REPLACE VIEW doctor_dashboard_stats AS
SELECT 
  d.id as doctor_id,
  d.first_name || ' ' || d.last_name as doctor_name,
  d.specialization,
  
  -- Appointment statistics
  COUNT(da.id) as total_appointments,
  COUNT(CASE WHEN da.status = 'completed' THEN 1 END) as completed_appointments,
  COUNT(CASE WHEN da.status IN ('assigned', 'confirmed') THEN 1 END) as upcoming_appointments,
  COUNT(CASE WHEN da.appointment_date = CURRENT_DATE THEN 1 END) as todays_appointments,
  
  -- Patient statistics
  COUNT(DISTINCT da.patient_id) as total_patients,
  COUNT(DISTINCT dpr.patient_id) as active_patients,
  
  -- Prescription statistics
  COUNT(DISTINCT p.id) as total_prescriptions,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_prescriptions,
  
  -- Recent activity
  MAX(da.appointment_date) as last_appointment_date,
  MAX(da.updated_at) as last_activity
  
FROM doctors d
LEFT JOIN doctor_appointments da ON d.id = da.doctor_id
LEFT JOIN doctor_patient_records dpr ON d.id = dpr.doctor_id AND dpr.is_active = true
LEFT JOIN prescriptions p ON d.id = p.doctor_id
GROUP BY d.id, d.first_name, d.last_name, d.specialization;

-- 13. Final verification
SELECT 'Enhanced doctor schema created successfully!' as message;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'doctor_%'
ORDER BY table_name;