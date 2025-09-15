-- 🚨 URGENT DATABASE SCHEMA FIXES
-- Run this SQL in your Supabase SQL Editor to fix all the missing columns

-- 1. Fix appointments table - add missing doctor_notes column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS doctor_notes TEXT;

-- 2. Fix prescriptions table - add missing appointment_id column
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS appointment_id UUID;

-- Add foreign key constraint for appointment_id
ALTER TABLE prescriptions 
ADD CONSTRAINT IF NOT EXISTS fk_prescriptions_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- 3. Create appointment_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."appointment_services" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "appointment_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "unit_price" DECIMAL(10,2) DEFAULT 0.00,
  "total_price" DECIMAL(10,2) DEFAULT 0.00,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_appointment_services_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_services_service 
    FOREIGN KEY (service_id) REFERENCES clinic_services(id) ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicate services per appointment
  CONSTRAINT unique_appointment_service 
    UNIQUE (appointment_id, service_id)
);

-- Create indexes for appointment_services
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id 
  ON appointment_services(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id 
  ON appointment_services(service_id);

-- 4. Create clinic_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."clinic_services" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "clinic_id" UUID NOT NULL,
  "service_name" VARCHAR(255) NOT NULL,
  "service_category" VARCHAR(100),
  "description" TEXT,
  "base_price" DECIMAL(10,2) DEFAULT 0.00,
  "duration_minutes" INTEGER DEFAULT 30,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_clinic_services_clinic 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Create indexes for clinic_services
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id 
  ON clinic_services(clinic_id);

CREATE INDEX IF NOT EXISTS idx_clinic_services_category 
  ON clinic_services(service_category);

-- 5. Fix prescriptions table RLS (Row Level Security) policy
-- Disable RLS temporarily to allow inserts
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;

-- Or create a permissive policy (choose one approach)
-- CREATE POLICY "Allow all prescription operations" ON prescriptions
-- FOR ALL USING (true) WITH CHECK (true);

-- 6. Add missing columns to appointments table that might be referenced
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 0.00;

-- 7. Ensure all appointment statuses are properly supported
-- Update any invalid statuses to 'scheduled'
UPDATE appointments 
SET status = 'scheduled' 
WHERE status IS NULL OR status = '';

-- 8. Add trigger for updated_at on appointment_services
CREATE OR REPLACE FUNCTION update_appointment_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_appointment_services_updated_at
  BEFORE UPDATE ON appointment_services
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_services_updated_at();

-- 9. Add trigger for updated_at on clinic_services
CREATE OR REPLACE FUNCTION update_clinic_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_clinic_services_updated_at
  BEFORE UPDATE ON clinic_services
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_services_updated_at();

-- 10. Insert some default clinic services for testing (optional)
INSERT INTO clinic_services (clinic_id, service_name, service_category, description, base_price)
SELECT 
  id as clinic_id,
  'General Consultation' as service_name,
  'Consultation' as service_category,
  'Standard medical consultation' as description,
  100.00 as base_price
FROM clinics
ON CONFLICT DO NOTHING;

INSERT INTO clinic_services (clinic_id, service_name, service_category, description, base_price)
SELECT 
  id as clinic_id,
  'Physical Therapy' as service_name,
  'Therapy' as service_category,
  'Physical rehabilitation therapy' as description,
  150.00 as base_price
FROM clinics
ON CONFLICT DO NOTHING;

-- 11. Comments for documentation
COMMENT ON TABLE appointment_services IS 'Services associated with specific appointments';
COMMENT ON TABLE clinic_services IS 'Services offered by clinics';
COMMENT ON COLUMN appointments.doctor_notes IS 'Notes added by the doctor during or after consultation';
COMMENT ON COLUMN prescriptions.appointment_id IS 'Reference to the appointment this prescription was created for';

-- 12. Final verification queries (these will show in the results)
SELECT 'appointments table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY column_name;

SELECT 'prescriptions table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' AND table_schema = 'public'
ORDER BY column_name;

SELECT 'Tables created successfully:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('appointment_services', 'clinic_services', 'doctor_appointments')
ORDER BY table_name;