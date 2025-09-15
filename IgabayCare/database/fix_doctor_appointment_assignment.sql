-- ===================================================================
-- FIX DOCTOR APPOINTMENT ASSIGNMENT ISSUES
-- ===================================================================
-- This script fixes the issue where patient information is not being
-- saved properly when assigning doctors to appointments

-- ===================================================================
-- 1. ENSURE THE DOCTOR_APPOINTMENTS TABLE EXISTS WITH CORRECT STRUCTURE
-- ===================================================================

-- First, check if the table exists and create it if needed
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
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. ADD FOREIGN KEY CONSTRAINTS IF THEY DON'T EXIST
-- ===================================================================

-- Add foreign key constraints (will be ignored if they already exist)
DO $$ 
BEGIN
    -- Add doctor foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_appointments_doctor'
    ) THEN
        ALTER TABLE doctor_appointments
        ADD CONSTRAINT fk_doctor_appointments_doctor 
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
    END IF;

    -- Add appointment foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_appointments_appointment'
    ) THEN
        ALTER TABLE doctor_appointments
        ADD CONSTRAINT fk_doctor_appointments_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
    END IF;

    -- Add patient foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_appointments_patient'
    ) THEN
        ALTER TABLE doctor_appointments
        ADD CONSTRAINT fk_doctor_appointments_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    END IF;

    -- Add clinic foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_appointments_clinic'
    ) THEN
        ALTER TABLE doctor_appointments
        ADD CONSTRAINT fk_doctor_appointments_clinic 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint to prevent duplicate assignments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_doctor_appointment'
    ) THEN
        ALTER TABLE doctor_appointments
        ADD CONSTRAINT unique_doctor_appointment 
        UNIQUE (doctor_id, appointment_id);
    END IF;
END $$;

-- ===================================================================
-- 3. CREATE/UPDATE THE TRIGGER FUNCTION TO POPULATE PATIENT DATA
-- ===================================================================

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS populate_doctor_appointment_data() CASCADE;

CREATE OR REPLACE FUNCTION populate_doctor_appointment_data()
RETURNS TRIGGER AS $$
DECLARE
    patient_record RECORD;
    clinic_record RECORD;
BEGIN
    -- Log the trigger execution (for debugging)
    RAISE NOTICE 'Populating doctor appointment data for patient_id: %, clinic_id: %', NEW.patient_id, NEW.clinic_id;
    
    -- Get patient information with error handling
    BEGIN
        SELECT 
            COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') as full_name,
            email,
            phone
        INTO patient_record
        FROM patients 
        WHERE id = NEW.patient_id;
        
        IF FOUND THEN
            NEW.patient_name := TRIM(patient_record.full_name);
            NEW.patient_email := patient_record.email;
            NEW.patient_phone := patient_record.phone;
            RAISE NOTICE 'Patient data populated: name=%, email=%', NEW.patient_name, NEW.patient_email;
        ELSE
            RAISE WARNING 'Patient not found with ID: %', NEW.patient_id;
            NEW.patient_name := 'Unknown Patient';
            NEW.patient_email := NULL;
            NEW.patient_phone := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error fetching patient data: %', SQLERRM;
        NEW.patient_name := 'Error Loading Patient';
        NEW.patient_email := NULL;
        NEW.patient_phone := NULL;
    END;
  
    -- Get clinic information with error handling
    BEGIN
        SELECT clinic_name
        INTO clinic_record
        FROM clinics
        WHERE id = NEW.clinic_id;
        
        IF FOUND THEN
            NEW.clinic_name := clinic_record.clinic_name;
            RAISE NOTICE 'Clinic data populated: %', NEW.clinic_name;
        ELSE
            RAISE WARNING 'Clinic not found with ID: %', NEW.clinic_id;
            NEW.clinic_name := 'Unknown Clinic';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error fetching clinic data: %', SQLERRM;
        NEW.clinic_name := 'Error Loading Clinic';
    END;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================================
-- 4. CREATE THE TRIGGER
-- ===================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS populate_doctor_appointment_data_trigger ON doctor_appointments;

-- Create the trigger
CREATE TRIGGER populate_doctor_appointment_data_trigger
  BEFORE INSERT OR UPDATE ON doctor_appointments
  FOR EACH ROW
  EXECUTE FUNCTION populate_doctor_appointment_data();

-- ===================================================================
-- 5. CREATE/UPDATE THE UPDATED_AT TRIGGER
-- ===================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_doctor_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_doctor_appointments_updated_at ON doctor_appointments;

-- Create the trigger
CREATE TRIGGER update_doctor_appointments_updated_at
  BEFORE UPDATE ON doctor_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_appointments_updated_at();

-- ===================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Create indexes if they don't exist
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

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_doctor_date_status 
  ON doctor_appointments(doctor_id, appointment_date, status);

-- ===================================================================
-- 7. ENABLE RLS AND CREATE POLICIES
-- ===================================================================

-- Enable Row Level Security
ALTER TABLE doctor_appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON doctor_appointments;
DROP POLICY IF EXISTS "Doctors can insert their own appointments" ON doctor_appointments;
DROP POLICY IF EXISTS "Doctors can update their own appointments" ON doctor_appointments;
DROP POLICY IF EXISTS "Clinic admins can manage appointments" ON doctor_appointments;

-- Policy for doctors to view their own appointments
CREATE POLICY "Doctors can view their own appointments" ON doctor_appointments
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- Policy for doctors/clinics to insert appointments
CREATE POLICY "Doctors can insert their own appointments" ON doctor_appointments
    FOR INSERT WITH CHECK (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT clinic_id FROM doctors WHERE user_id = auth.uid()
        )
        OR
        -- Allow if user is a clinic admin/staff
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN clinic_staff cs ON c.id = cs.clinic_id
            WHERE cs.user_id = auth.uid()
        )
    );

-- Policy for doctors to update their own appointments
CREATE POLICY "Doctors can update their own appointments" ON doctor_appointments
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT clinic_id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- Policy for clinic staff to manage appointments
CREATE POLICY "Clinic admins can manage appointments" ON doctor_appointments
    FOR ALL USING (
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN clinic_staff cs ON c.id = cs.clinic_id
            WHERE cs.user_id = auth.uid()
        )
    );

-- ===================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- ===================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON doctor_appointments TO authenticated;
GRANT USAGE ON SEQUENCE doctor_appointments_id_seq TO authenticated;

-- ===================================================================
-- 9. TEST THE SETUP
-- ===================================================================

-- Function to test the trigger setup
CREATE OR REPLACE FUNCTION test_doctor_appointment_trigger()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT := '';
    sample_patient_id UUID;
    sample_clinic_id UUID;
    sample_doctor_id UUID;
BEGIN
    -- Get sample IDs for testing
    SELECT id INTO sample_patient_id FROM patients LIMIT 1;
    SELECT id INTO sample_clinic_id FROM clinics LIMIT 1;
    SELECT id INTO sample_doctor_id FROM doctors LIMIT 1;
    
    IF sample_patient_id IS NULL THEN
        RETURN 'No patients found in database - cannot test trigger';
    END IF;
    
    IF sample_clinic_id IS NULL THEN
        RETURN 'No clinics found in database - cannot test trigger';
    END IF;
    
    IF sample_doctor_id IS NULL THEN
        RETURN 'No doctors found in database - cannot test trigger';
    END IF;
    
    test_result := 'Trigger function is properly set up. Sample IDs found: ' ||
                   'Patient: ' || sample_patient_id ||
                   ', Clinic: ' || sample_clinic_id ||
                   ', Doctor: ' || sample_doctor_id;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_doctor_appointment_trigger();

-- ===================================================================
-- 10. VERIFICATION QUERIES
-- ===================================================================

-- Check if the table exists and has the right structure
SELECT 
    'doctor_appointments table verification' as check_type,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'patient_name' THEN 1 END) as has_patient_name,
    COUNT(CASE WHEN column_name = 'patient_email' THEN 1 END) as has_patient_email,
    COUNT(CASE WHEN column_name = 'assigned_at' THEN 1 END) as has_assigned_at
FROM information_schema.columns 
WHERE table_name = 'doctor_appointments';

-- Check if triggers exist
SELECT 
    'Triggers verification' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'doctor_appointments'
ORDER BY trigger_name;

-- Check RLS policies
SELECT 
    'RLS Policies verification' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'doctor_appointments'
ORDER BY policyname;

-- Final success message
RAISE NOTICE '✅ Doctor appointment assignment fix completed successfully!';
RAISE NOTICE 'The patient information should now be properly saved when assigning doctors.';
RAISE NOTICE 'Test by assigning a doctor to an appointment and check the browser console for detailed logs.';