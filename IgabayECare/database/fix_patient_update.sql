-- Fix Patient Profile Update Issues
-- This script addresses common issues with patient profile updates

-- 1. Check and fix RLS policies for patients table
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Patients can insert own profile" ON patients;
DROP POLICY IF EXISTS "Patients can delete own profile" ON patients;

-- 2. Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 3. Create comprehensive RLS policies for patients table
-- Allow patients to view their own profile
CREATE POLICY "Patients can view own profile" ON patients
    FOR SELECT USING (auth.uid() = user_id);

-- Allow patients to update their own profile
CREATE POLICY "Patients can update own profile" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow patients to insert their own profile
CREATE POLICY "Patients can insert own profile" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow patients to delete their own profile
CREATE POLICY "Patients can delete own profile" ON patients
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT ON patients TO anon;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;

-- Create trigger
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients
    FOR EACH ROW 
    EXECUTE FUNCTION update_patients_updated_at();

-- 7. Create function to validate patient data
CREATE OR REPLACE FUNCTION validate_patient_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Validate first name is not empty
    IF NEW.first_name IS NULL OR TRIM(NEW.first_name) = '' THEN
        RAISE EXCEPTION 'First name cannot be empty';
    END IF;
    
    -- Validate last name is not empty
    IF NEW.last_name IS NULL OR TRIM(NEW.last_name) = '' THEN
        RAISE EXCEPTION 'Last name cannot be empty';
    END IF;
    
    -- Validate date of birth if provided
    IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth > CURRENT_DATE THEN
        RAISE EXCEPTION 'Date of birth cannot be in the future';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_patient_data_trigger ON patients;

-- Create trigger
CREATE TRIGGER validate_patient_data_trigger
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION validate_patient_data();

-- 8. Create function to get patient by user ID
CREATE OR REPLACE FUNCTION get_patient_by_user_id(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    date_of_birth date,
    address text,
    emergency_contact text,
    blood_type text,
    allergies text,
    medications text,
    medical_conditions text,
    profile_picture_url text,
    profile_picture_path text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.date_of_birth,
        p.address,
        p.emergency_contact,
        p.blood_type,
        p.allergies,
        p.medications,
        p.medical_conditions,
        p.profile_picture_url,
        p.profile_picture_path,
        p.created_at,
        p.updated_at
    FROM patients p
    WHERE p.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_patient_by_user_id(uuid) TO authenticated;

-- 9. Create function to update patient profile
CREATE OR REPLACE FUNCTION update_patient_profile(
    user_uuid uuid,
    update_data jsonb
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    date_of_birth date,
    address text,
    emergency_contact text,
    blood_type text,
    allergies text,
    medications text,
    medical_conditions text,
    profile_picture_url text,
    profile_picture_path text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    -- Update the patient profile
    UPDATE patients 
    SET 
        first_name = COALESCE(update_data->>'first_name', first_name),
        last_name = COALESCE(update_data->>'last_name', last_name),
        email = COALESCE(update_data->>'email', email),
        phone = COALESCE(update_data->>'phone', phone),
        date_of_birth = COALESCE((update_data->>'date_of_birth')::date, date_of_birth),
        address = COALESCE(update_data->>'address', address),
        emergency_contact = COALESCE(update_data->>'emergency_contact', emergency_contact),
        blood_type = COALESCE(update_data->>'blood_type', blood_type),
        allergies = COALESCE(update_data->>'allergies', allergies),
        medications = COALESCE(update_data->>'medications', medications),
        medical_conditions = COALESCE(update_data->>'medical_conditions', medical_conditions),
        profile_picture_url = COALESCE(update_data->>'profile_picture_url', profile_picture_url),
        profile_picture_path = COALESCE(update_data->>'profile_picture_path', profile_picture_path),
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Return the updated patient data
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.date_of_birth,
        p.address,
        p.emergency_contact,
        p.blood_type,
        p.allergies,
        p.medications,
        p.medical_conditions,
        p.profile_picture_url,
        p.profile_picture_path,
        p.created_at,
        p.updated_at
    FROM patients p
    WHERE p.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_patient_profile(uuid, jsonb) TO authenticated;

-- 10. Test data insertion (optional - for testing)
-- INSERT INTO patients (
--     user_id,
--     first_name,
--     last_name,
--     email,
--     phone,
--     date_of_birth,
--     address,
--     emergency_contact,
--     blood_type,
--     allergies,
--     medications,
--     medical_conditions
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
--     'John',
--     'Doe',
--     'john.doe@example.com',
--     '+1234567890',
--     '1990-01-01',
--     '123 Main St, City, State 12345',
--     'Jane Doe, +1234567891',
--     'O+',
--     'Penicillin',
--     'None',
--     'None'
-- );

-- 11. Verification queries
-- Check if patients table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
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
WHERE tablename = 'patients';

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'patients';

-- Success message
SELECT 'Patient update fixes applied successfully!' as status; 