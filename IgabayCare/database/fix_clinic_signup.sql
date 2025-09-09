-- Fix Clinic Signup Issues
-- This script addresses common issues with clinic registration

-- 1. Ensure clinics table exists with correct structure
CREATE TABLE IF NOT EXISTS public.clinics (
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
  latitude numeric(10,8),
  longitude numeric(11,8),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);

-- Add latitude and longitude columns to existing clinics table if they don't exist
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8);

-- 2. Drop existing RLS policies for clinics to recreate them
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can delete own profile" ON clinics;

-- 3. Enable RLS on clinics table
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- 4. Create comprehensive RLS policies for clinics
-- Allow clinics to view their own profile
CREATE POLICY "Clinics can view own profile" ON clinics
    FOR SELECT USING (auth.uid() = user_id);

-- Allow clinics to update their own profile
CREATE POLICY "Clinics can update own profile" ON clinics
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow clinics to insert their own profile
CREATE POLICY "Clinics can insert own profile" ON clinics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow clinics to delete their own profile
CREATE POLICY "Clinics can delete own profile" ON clinics
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to approved clinics (for patient search)
CREATE POLICY "Public can view approved clinics" ON clinics
    FOR SELECT USING (status = 'approved');

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinics_user_id ON clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_specialties ON clinics USING GIN(specialties);

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clinics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;

-- Create trigger
CREATE TRIGGER update_clinics_updated_at 
    BEFORE UPDATE ON clinics
    FOR EACH ROW 
    EXECUTE FUNCTION update_clinics_updated_at();

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON clinics TO authenticated;
GRANT SELECT ON clinics TO anon;

-- 8. Create function to handle clinic registration
CREATE OR REPLACE FUNCTION handle_clinic_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default values if not provided
    IF NEW.specialties IS NULL THEN
        NEW.specialties = '{}';
    END IF;
    
    IF NEW.custom_specialties IS NULL THEN
        NEW.custom_specialties = '{}';
    END IF;
    
    IF NEW.services IS NULL THEN
        NEW.services = '{}';
    END IF;
    
    IF NEW.custom_services IS NULL THEN
        NEW.custom_services = '{}';
    END IF;
    
    IF NEW.operating_hours IS NULL THEN
        NEW.operating_hours = '{
            "monday": {"open": "08:00", "close": "18:00"},
            "tuesday": {"open": "08:00", "close": "18:00"},
            "wednesday": {"open": "08:00", "close": "18:00"},
            "thursday": {"open": "08:00", "close": "18:00"},
            "friday": {"open": "08:00", "close": "18:00"},
            "saturday": {"open": "09:00", "close": "16:00"},
            "sunday": {"open": "10:00", "close": "14:00"}
        }'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_clinic_registration_trigger ON clinics;

-- Create trigger
CREATE TRIGGER handle_clinic_registration_trigger
    BEFORE INSERT ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION handle_clinic_registration();

-- 9. Create view for public clinic information
CREATE OR REPLACE VIEW public_clinics_view AS
SELECT 
    id,
    clinic_name,
    email,
    phone,
    website,
    address,
    city,
    state,
    zip_code,
    specialties,
    custom_specialties,
    services,
    custom_services,
    operating_hours,
    number_of_doctors,
    number_of_staff,
    description,
    created_at
FROM clinics 
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public_clinics_view TO authenticated;
GRANT SELECT ON public_clinics_view TO anon;

-- 10. Create function to validate clinic data
CREATE OR REPLACE FUNCTION validate_clinic_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Validate clinic name is not empty
    IF NEW.clinic_name IS NULL OR TRIM(NEW.clinic_name) = '' THEN
        RAISE EXCEPTION 'Clinic name cannot be empty';
    END IF;
    
    -- Validate year established if provided
    IF NEW.year_established IS NOT NULL AND (NEW.year_established < 1900 OR NEW.year_established > EXTRACT(YEAR FROM NOW())) THEN
        RAISE EXCEPTION 'Invalid year established';
    END IF;
    
    -- Validate numbers are positive
    IF NEW.number_of_doctors IS NOT NULL AND NEW.number_of_doctors < 0 THEN
        RAISE EXCEPTION 'Number of doctors cannot be negative';
    END IF;
    
    IF NEW.number_of_staff IS NOT NULL AND NEW.number_of_staff < 0 THEN
        RAISE EXCEPTION 'Number of staff cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_clinic_data_trigger ON clinics;

-- Create trigger
CREATE TRIGGER validate_clinic_data_trigger
    BEFORE INSERT OR UPDATE ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION validate_clinic_data();

-- 11. Insert test clinic data (optional - for testing)
-- INSERT INTO clinics (
--     user_id,
--     clinic_name,
--     email,
--     phone,
--     address,
--     city,
--     state,
--     zip_code,
--     specialties,
--     services,
--     status
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
--     'Test Clinic',
--     'test@clinic.com',
--     '+1234567890',
--     '123 Test Street',
--     'Test City',
--     'TS',
--     '12345',
--     ARRAY['Cardiology', 'Dermatology'],
--     ARRAY['General Consultation', 'Vaccination'],
--     'approved'
-- );

-- 12. Create function to get clinic by user ID
CREATE OR REPLACE FUNCTION get_clinic_by_user_id(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    clinic_name text,
    email text,
    phone text,
    website text,
    address text,
    city text,
    state text,
    zip_code text,
    specialties text[],
    custom_specialties text[],
    services text[],
    custom_services text[],
    operating_hours jsonb,
    number_of_doctors integer,
    number_of_staff integer,
    description text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.clinic_name,
        c.email,
        c.phone,
        c.website,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.specialties,
        c.custom_specialties,
        c.services,
        c.custom_services,
        c.operating_hours,
        c.number_of_doctors,
        c.number_of_staff,
        c.description,
        c.status,
        c.created_at,
        c.updated_at
    FROM clinics c
    WHERE c.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_clinic_by_user_id(uuid) TO authenticated;

-- 13. Create function to update clinic status
CREATE OR REPLACE FUNCTION update_clinic_status(clinic_uuid uuid, new_status text)
RETURNS boolean AS $$
BEGIN
    UPDATE clinics 
    SET status = new_status, updated_at = NOW()
    WHERE id = clinic_uuid;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_clinic_status(uuid, text) TO authenticated;

-- 14. Create function to search clinics
CREATE OR REPLACE FUNCTION search_clinics(
    search_term text DEFAULT '',
    city_filter text DEFAULT '',
    specialty_filter text DEFAULT ''
)
RETURNS TABLE (
    id uuid,
    clinic_name text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    specialties text[],
    services text[],
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.clinic_name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.specialties,
        c.services,
        c.status
    FROM clinics c
    WHERE c.status = 'approved'
    AND (
        search_term = '' OR 
        c.clinic_name ILIKE '%' || search_term || '%' OR
        c.description ILIKE '%' || search_term || '%'
    )
    AND (
        city_filter = '' OR 
        c.city ILIKE '%' || city_filter || '%'
    )
    AND (
        specialty_filter = '' OR 
        c.specialties @> ARRAY[specialty_filter] OR
        c.custom_specialties @> ARRAY[specialty_filter]
    )
    ORDER BY c.clinic_name;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_clinics(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_clinics(text, text, text) TO anon;

-- 15. Final verification queries
-- Check if clinics table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'clinics';

-- Success message
SELECT 'Clinic signup fixes applied successfully!' as status; 