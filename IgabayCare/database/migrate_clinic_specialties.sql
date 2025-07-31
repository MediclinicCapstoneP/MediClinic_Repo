-- Migration script to move clinic specialties to separate table
-- This script should be run after creating the clinic_specialties table

-- Step 1: Migrate existing specialties data from clinics table to clinic_specialties table
-- Handle standard specialties
INSERT INTO "public"."clinic_specialties" ("clinic_id", "specialty_name", "is_custom")
SELECT 
    c.id as clinic_id,
    unnest(c.specialties) as specialty_name,
    false as is_custom
FROM "public"."clinics" c
WHERE c.specialties IS NOT NULL AND array_length(c.specialties, 1) > 0
ON CONFLICT (clinic_id, specialty_name) DO NOTHING;

-- Handle custom specialties
INSERT INTO "public"."clinic_specialties" ("clinic_id", "specialty_name", "is_custom")
SELECT 
    c.id as clinic_id,
    unnest(c.custom_specialties) as specialty_name,
    true as is_custom
FROM "public"."clinics" c
WHERE c.custom_specialties IS NOT NULL AND array_length(c.custom_specialties, 1) > 0
ON CONFLICT (clinic_id, specialty_name) DO NOTHING;

-- Step 2: Remove specialties columns from clinics table
-- First, create a backup of the clinics table (optional but recommended)
CREATE TABLE IF NOT EXISTS "public"."clinics_backup" AS 
SELECT * FROM "public"."clinics";

-- Remove the specialties columns from clinics table
ALTER TABLE "public"."clinics" 
DROP COLUMN IF EXISTS "specialties",
DROP COLUMN IF EXISTS "custom_specialties";

-- Step 3: Update the clinics table comment
COMMENT ON TABLE "public"."clinics" IS 'Clinic profiles - specialties are now stored in clinic_specialties table';

-- Step 4: Verify migration
-- Check that all specialties were migrated
SELECT 
    'Clinics with specialties' as check_type,
    COUNT(*) as count
FROM "public"."clinics" c
WHERE EXISTS (
    SELECT 1 FROM "public"."clinic_specialties" cs 
    WHERE cs.clinic_id = c.id
)
UNION ALL
SELECT 
    'Total specialties migrated' as check_type,
    COUNT(*) as count
FROM "public"."clinic_specialties";

-- Step 5: Clean up template specialties (remove the dummy clinic_id entries)
DELETE FROM "public"."clinic_specialties" 
WHERE clinic_id = '00000000-0000-0000-0000-000000000000';

-- Step 6: Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW "public"."clinics_with_specialties" AS
SELECT 
    c.*,
    ARRAY_AGG(CASE WHEN cs.is_custom = false THEN cs.specialty_name END) FILTER (WHERE cs.is_custom = false) as specialties,
    ARRAY_AGG(CASE WHEN cs.is_custom = true THEN cs.specialty_name END) FILTER (WHERE cs.is_custom = true) as custom_specialties
FROM "public"."clinics" c
LEFT JOIN "public"."clinic_specialties" cs ON c.id = cs.clinic_id
GROUP BY c.id, c.user_id, c.clinic_name, c.email, c.phone, c.website, c.address, c.city, c.state, c.zip_code, 
         c.license_number, c.accreditation, c.tax_id, c.year_established, c.services, c.custom_services, 
         c.operating_hours, c.number_of_doctors, c.number_of_staff, c.description, c.status, c.created_at, c.updated_at;

-- Add comment to the view
COMMENT ON VIEW "public"."clinics_with_specialties" IS 'Backward compatibility view that includes specialties as arrays'; 