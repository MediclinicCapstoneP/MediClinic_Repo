-- Create doctor_appointments table
-- This table stores appointments specifically assigned to doctors
-- When a clinic assigns a doctor to an appointment, a record is created here

CREATE TABLE IF NOT EXISTS "public"."doctor_appointments" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "doctor_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  
  -- Copy key appointment details for easy querying
  "appointment_date" DATE NOT NULL,
  "appointment_time" TIME NOT NULL,
  "appointment_type" VARCHAR(50) NOT NULL,
  "duration_minutes" INTEGER DEFAULT 30,
  
  -- Doctor-specific fields
  "status" VARCHAR(50) DEFAULT 'assigned',
  "doctor_notes" TEXT,
  "consultation_notes" TEXT,
  "prescription_given" BOOLEAN DEFAULT FALSE,
  
  -- Patient information (denormalized for performance)
  "patient_name" VARCHAR(255),
  "patient_email" VARCHAR(255),
  "patient_phone" VARCHAR(20),
  
  -- Clinic information (denormalized for performance)
  "clinic_name" VARCHAR(255),
  
  -- Payment and billing
  "payment_amount" DECIMAL(10,2) DEFAULT 0.00,
  "payment_status" VARCHAR(50) DEFAULT 'pending',
  
  -- Priority and special notes
  "priority" VARCHAR(20) DEFAULT 'normal',
  "special_instructions" TEXT,
  
  -- Timestamps
  "assigned_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_doctor_appointments_doctor 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_appointments_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_appointments_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_appointments_clinic 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicate assignments
  CONSTRAINT unique_doctor_appointment 
    UNIQUE (doctor_id, appointment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_appointments_doctor_id 
  ON doctor_appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_appointment_date 
  ON doctor_appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_status 
  ON doctor_appointments(status);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_patient_id 
  ON doctor_appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_clinic_id 
  ON doctor_appointments(clinic_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_doctor_appointments_doctor_date_status 
  ON doctor_appointments(doctor_id, appointment_date, status);

-- Add comments for documentation
COMMENT ON TABLE doctor_appointments IS 'Stores appointments assigned to specific doctors';
COMMENT ON COLUMN doctor_appointments.status IS 'Values: assigned, confirmed, in_progress, completed, cancelled, rescheduled';
COMMENT ON COLUMN doctor_appointments.priority IS 'Values: low, normal, high, urgent';
COMMENT ON COLUMN doctor_appointments.payment_status IS 'Values: pending, paid, refunded, cancelled';

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_doctor_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctor_appointments_updated_at
  BEFORE UPDATE ON doctor_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_appointments_updated_at();

-- Create function to automatically populate denormalized data
CREATE OR REPLACE FUNCTION populate_doctor_appointment_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Get patient information
  SELECT 
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    phone
  INTO 
    NEW.patient_name,
    NEW.patient_email,
    NEW.patient_phone
  FROM patients 
  WHERE id = NEW.patient_id;
  
  -- Get clinic information
  SELECT clinic_name
  INTO NEW.clinic_name
  FROM clinics
  WHERE id = NEW.clinic_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER populate_doctor_appointment_data_trigger
  BEFORE INSERT OR UPDATE ON doctor_appointments
  FOR EACH ROW
  EXECUTE FUNCTION populate_doctor_appointment_data();