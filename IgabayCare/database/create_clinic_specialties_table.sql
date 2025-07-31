-- Create clinic_specialties table
CREATE TABLE IF NOT EXISTS "public"."clinic_specialties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "clinic_id" uuid NOT NULL REFERENCES "public"."clinics"("id") ON DELETE CASCADE,
    "specialty_name" text NOT NULL,
    "is_custom" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "clinic_specialties_clinic_id_idx" ON "public"."clinic_specialties" ("clinic_id");
CREATE INDEX IF NOT EXISTS "clinic_specialties_specialty_name_idx" ON "public"."clinic_specialties" ("specialty_name");

-- Create unique constraint to prevent duplicate specialties for the same clinic
CREATE UNIQUE INDEX IF NOT EXISTS "clinic_specialties_clinic_specialty_unique" 
ON "public"."clinic_specialties" ("clinic_id", "specialty_name");

-- Enable Row Level Security
ALTER TABLE "public"."clinic_specialties" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clinic_specialties table
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clinic_specialties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clinic_specialties_updated_at_trigger
    BEFORE UPDATE ON "public"."clinic_specialties"
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_specialties_updated_at();

-- Insert some common medical specialties
INSERT INTO "public"."clinic_specialties" ("clinic_id", "specialty_name", "is_custom") VALUES
-- These will be used as templates, clinic_id will be set when clinics register
('00000000-0000-0000-0000-000000000000', 'Cardiology', false),
('00000000-0000-0000-0000-000000000000', 'Dermatology', false),
('00000000-0000-0000-0000-000000000000', 'Neurology', false),
('00000000-0000-0000-0000-000000000000', 'Orthopedics', false),
('00000000-0000-0000-0000-000000000000', 'Pediatrics', false),
('00000000-0000-0000-0000-000000000000', 'Psychiatry', false),
('00000000-0000-0000-0000-000000000000', 'Internal Medicine', false),
('00000000-0000-0000-0000-000000000000', 'Family Medicine', false),
('00000000-0000-0000-0000-000000000000', 'Emergency Medicine', false),
('00000000-0000-0000-0000-000000000000', 'Surgery', false),
('00000000-0000-0000-0000-000000000000', 'Obstetrics & Gynecology', false),
('00000000-0000-0000-0000-000000000000', 'Ophthalmology', false),
('00000000-0000-0000-0000-000000000000', 'ENT (Ear, Nose, Throat)', false),
('00000000-0000-0000-0000-000000000000', 'Radiology', false),
('00000000-0000-0000-0000-000000000000', 'Anesthesiology', false),
('00000000-0000-0000-0000-000000000000', 'Pathology', false),
('00000000-0000-0000-0000-000000000000', 'Oncology', false),
('00000000-0000-0000-0000-000000000000', 'Endocrinology', false),
('00000000-0000-0000-0000-000000000000', 'Gastroenterology', false),
('00000000-0000-0000-0000-000000000000', 'Pulmonology', false),
('00000000-0000-0000-0000-000000000000', 'Nephrology', false),
('00000000-0000-0000-0000-000000000000', 'Rheumatology', false),
('00000000-0000-0000-0000-000000000000', 'Infectious Disease', false),
('00000000-0000-0000-0000-000000000000', 'Physical Medicine & Rehabilitation', false)
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE "public"."clinic_specialties" IS 'Stores medical specialties for each clinic with support for custom specialties'; 