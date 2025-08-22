-- Complete setup for clinic specialties system
-- This script creates both the clinic_specialties table and standard_specialties reference table

-- Step 1: Create the clinic_specialties table
CREATE TABLE IF NOT EXISTS "public"."clinic_specialties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "clinic_id" uuid NOT NULL REFERENCES "public"."clinics"("id") ON DELETE CASCADE,
    "specialty_name" text NOT NULL,
    "is_custom" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "clinic_specialties_clinic_id_idx" ON "public"."clinic_specialties" ("clinic_id");
CREATE INDEX IF NOT EXISTS "clinic_specialties_specialty_name_idx" ON "public"."clinic_specialties" ("specialty_name");

-- Step 3: Create unique constraint to prevent duplicate specialties for the same clinic
CREATE UNIQUE INDEX IF NOT EXISTS "clinic_specialties_clinic_specialty_unique" 
ON "public"."clinic_specialties" ("clinic_id", "specialty_name");

-- Step 4: Enable Row Level Security
ALTER TABLE "public"."clinic_specialties" ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for clinic_specialties table
-- Allow clinic owners to manage their own specialties
CREATE POLICY "clinic_specialties_clinic_owner_policy" ON "public"."clinic_specialties"
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM clinics 
            WHERE user_id = auth.uid()
        )
    );

-- Allow public read access to approved clinics' specialties
CREATE POLICY "clinic_specialties_public_read_policy" ON "public"."clinic_specialties"
    FOR SELECT USING (
        clinic_id IN (
            SELECT id FROM clinics 
            WHERE status = 'approved'
        )
    );

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clinic_specialties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update updated_at
CREATE TRIGGER update_clinic_specialties_updated_at_trigger
    BEFORE UPDATE ON "public"."clinic_specialties"
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_specialties_updated_at();

-- Step 8: Create standard_specialties reference table
CREATE TABLE IF NOT EXISTS "public"."standard_specialties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "specialty_name" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 9: Insert standard specialties into the reference table
INSERT INTO "public"."standard_specialties" ("specialty_name") VALUES
('Cardiology'),
('Dermatology'),
('Neurology'),
('Orthopedics'),
('Pediatrics'),
('Psychiatry'),
('Internal Medicine'),
('Family Medicine'),
('Emergency Medicine'),
('Surgery'),
('Obstetrics & Gynecology'),
('Ophthalmology'),
('ENT (Ear, Nose, Throat)'),
('Radiology'),
('Anesthesiology'),
('Pathology'),
('Oncology'),
('Endocrinology'),
('Gastroenterology'),
('Pulmonology'),
('Nephrology'),
('Rheumatology'),
('Infectious Disease'),
('Physical Medicine & Rehabilitation')
ON CONFLICT (specialty_name) DO NOTHING;

-- Step 10: Create function to get all standard specialties
CREATE OR REPLACE FUNCTION get_all_standard_specialties()
RETURNS TABLE(specialty_name text) AS $$
BEGIN
    RETURN QUERY 
    SELECT s.specialty_name 
    FROM standard_specialties s 
    ORDER BY s.specialty_name;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Add comments to tables
COMMENT ON TABLE "public"."clinic_specialties" IS 'Stores medical specialties for each clinic with support for custom specialties';
COMMENT ON TABLE "public"."standard_specialties" IS 'Reference table for standard medical specialties';

-- Step 12: Verify setup
SELECT 
    'Tables created successfully' as status,
    COUNT(*) as clinic_specialties_count
FROM information_schema.tables 
WHERE table_name = 'clinic_specialties'
UNION ALL
SELECT 
    'Standard specialties loaded' as status,
    COUNT(*) as standard_specialties_count
FROM standard_specialties; 