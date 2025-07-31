-- Simple approach: Create a view or function to get standard specialties
-- This avoids the need for a template clinic entirely

-- Option 1: Create a function to return standard specialties
CREATE OR REPLACE FUNCTION get_standard_specialties()
RETURNS TABLE(specialty_name text) AS $$
BEGIN
    RETURN QUERY VALUES 
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
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

-- Option 2: Create a simple table for standard specialties (no clinic relationship needed)
CREATE TABLE IF NOT EXISTS "public"."standard_specialties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "specialty_name" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert standard specialties into the reference table
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

-- Create a function to get all standard specialties
CREATE OR REPLACE FUNCTION get_all_standard_specialties()
RETURNS TABLE(specialty_name text) AS $$
BEGIN
    RETURN QUERY 
    SELECT s.specialty_name 
    FROM standard_specialties s 
    ORDER BY s.specialty_name;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM get_standard_specialties();
-- SELECT * FROM get_all_standard_specialties(); 