-- Comprehensive Clinic Registration Fix Script
-- This script addresses clinic profile issues where data was not properly saved during registration
-- and status remained as 'pending'

-- =================================================================================
-- PART 1: IDENTIFY CLINIC USERS WITH MISSING OR INCOMPLETE PROFILES  
-- =================================================================================

-- Find clinic users without profiles
CREATE OR REPLACE VIEW missing_clinic_profiles AS
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'clinic_name' as clinic_name,
    u.raw_user_meta_data->>'role' as role,
    u.email_confirmed_at,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.clinics c ON c.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'clinic'
AND c.id IS NULL
AND u.email_confirmed_at IS NOT NULL; -- Only confirmed users

-- Find clinic profiles with incomplete data (mostly nulls)
CREATE OR REPLACE VIEW incomplete_clinic_profiles AS
SELECT 
    c.*,
    u.email as user_email,
    u.raw_user_meta_data
FROM public.clinics c
JOIN auth.users u ON u.id = c.user_id
WHERE c.phone IS NULL 
AND c.address IS NULL 
AND c.city IS NULL 
AND c.state IS NULL
AND c.description IS NULL
AND c.license_number IS NULL
AND u.raw_user_meta_data->>'role' = 'clinic';

-- =================================================================================
-- PART 2: FUNCTIONS TO CREATE/UPDATE CLINIC PROFILES
-- =================================================================================

-- Function to create clinic profile from user metadata
CREATE OR REPLACE FUNCTION create_clinic_profile_from_metadata(user_id_param UUID)
RETURNS TABLE(
    success BOOLEAN,
    clinic_id UUID,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    registration_data JSONB;
    new_clinic_id UUID;
    clinic_name_val TEXT;
BEGIN
    -- Get user record
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE id = user_id_param;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'User not found';
        RETURN;
    END IF;
    
    -- Check if user is a clinic user
    IF (user_record.raw_user_meta_data->>'role') != 'clinic' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'User is not a clinic user';
        RETURN;
    END IF;
    
    -- Check if clinic profile already exists
    IF EXISTS (SELECT 1 FROM public.clinics WHERE user_id = user_id_param) THEN
        SELECT id INTO new_clinic_id FROM public.clinics WHERE user_id = user_id_param;
        RETURN QUERY SELECT TRUE, new_clinic_id, 'Clinic profile already exists';
        RETURN;
    END IF;
    
    -- Extract clinic name
    clinic_name_val := COALESCE(
        user_record.raw_user_meta_data->>'clinic_name',
        user_record.raw_user_meta_data->>'first_name',
        'My Clinic'
    );
    
    -- Get registration data if available
    registration_data := user_record.raw_user_meta_data->'clinic_registration_data';
    
    -- Create clinic profile
    IF registration_data IS NOT NULL THEN
        -- Create full profile from registration data
        INSERT INTO public.clinics (
            user_id, clinic_name, email, phone, website, address, city, state, zip_code,
            license_number, accreditation, tax_id, year_established,
            specialties, custom_specialties, services, custom_services,
            operating_hours, number_of_doctors, number_of_staff, description, status
        ) VALUES (
            user_id_param,
            COALESCE(registration_data->>'clinic_name', clinic_name_val),
            COALESCE(registration_data->>'email', user_record.email),
            registration_data->>'phone',
            registration_data->>'website',
            registration_data->>'address',
            registration_data->>'city',
            registration_data->>'state',
            registration_data->>'zip_code',
            registration_data->>'license_number',
            registration_data->>'accreditation',
            registration_data->>'tax_id',
            CASE 
                WHEN registration_data->>'year_established' IS NOT NULL 
                THEN (registration_data->>'year_established')::INTEGER 
                ELSE NULL 
            END,
            COALESCE(registration_data->'specialties', '[]'::jsonb),
            COALESCE(registration_data->'custom_specialties', '[]'::jsonb),
            COALESCE(registration_data->'services', '[]'::jsonb),
            COALESCE(registration_data->'custom_services', '[]'::jsonb),
            COALESCE(registration_data->'operating_hours', '{
                "monday": {"open": "08:00", "close": "18:00"},
                "tuesday": {"open": "08:00", "close": "18:00"},
                "wednesday": {"open": "08:00", "close": "18:00"},
                "thursday": {"open": "08:00", "close": "18:00"},
                "friday": {"open": "08:00", "close": "18:00"},
                "saturday": {"open": "09:00", "close": "16:00"},
                "sunday": {"open": "10:00", "close": "14:00"}
            }'::jsonb),
            COALESCE((registration_data->>'number_of_doctors')::INTEGER, 0),
            COALESCE((registration_data->>'number_of_staff')::INTEGER, 0),
            registration_data->>'description',
            'approved' -- Set status to approved for verified users
        ) RETURNING id INTO new_clinic_id;
        
        RETURN QUERY SELECT TRUE, new_clinic_id, 'Full clinic profile created from registration data';
    ELSE
        -- Create basic profile
        INSERT INTO public.clinics (
            user_id, clinic_name, email, specialties, custom_specialties, 
            services, custom_services, operating_hours, number_of_doctors, 
            number_of_staff, status
        ) VALUES (
            user_id_param,
            clinic_name_val,
            user_record.email,
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            '{
                "monday": {"open": "08:00", "close": "18:00"},
                "tuesday": {"open": "08:00", "close": "18:00"},
                "wednesday": {"open": "08:00", "close": "18:00"},
                "thursday": {"open": "08:00", "close": "18:00"},
                "friday": {"open": "08:00", "close": "18:00"},
                "saturday": {"open": "09:00", "close": "16:00"},
                "sunday": {"open": "10:00", "close": "14:00"}
            }'::jsonb,
            0,
            0,
            'approved'
        ) RETURNING id INTO new_clinic_id;
        
        RETURN QUERY SELECT TRUE, new_clinic_id, 'Basic clinic profile created';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Error: ' || SQLERRM;
END;
$$;

-- Function to update incomplete clinic profiles
CREATE OR REPLACE FUNCTION update_incomplete_clinic_profile(clinic_id_param UUID)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clinic_record RECORD;
    user_record RECORD;
    registration_data JSONB;
BEGIN
    -- Get clinic and user records
    SELECT c.*, u.raw_user_meta_data INTO clinic_record, user_record
    FROM public.clinics c
    JOIN auth.users u ON u.id = c.user_id
    WHERE c.id = clinic_id_param;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Clinic not found';
        RETURN;
    END IF;
    
    -- Get registration data if available
    registration_data := user_record.raw_user_meta_data->'clinic_registration_data';
    
    IF registration_data IS NOT NULL THEN
        -- Update with registration data
        UPDATE public.clinics SET
            clinic_name = COALESCE(NULLIF(clinic_name, ''), registration_data->>'clinic_name', clinic_name),
            phone = COALESCE(phone, registration_data->>'phone'),
            website = COALESCE(website, registration_data->>'website'),
            address = COALESCE(address, registration_data->>'address'),
            city = COALESCE(city, registration_data->>'city'),
            state = COALESCE(state, registration_data->>'state'),
            zip_code = COALESCE(zip_code, registration_data->>'zip_code'),
            license_number = COALESCE(license_number, registration_data->>'license_number'),
            accreditation = COALESCE(accreditation, registration_data->>'accreditation'),
            tax_id = COALESCE(tax_id, registration_data->>'tax_id'),
            year_established = COALESCE(
                year_established, 
                CASE 
                    WHEN registration_data->>'year_established' IS NOT NULL 
                    THEN (registration_data->>'year_established')::INTEGER 
                    ELSE NULL 
                END
            ),
            description = COALESCE(description, registration_data->>'description'),
            specialties = COALESCE(
                CASE WHEN jsonb_array_length(specialties) > 0 THEN specialties ELSE NULL END,
                registration_data->'specialties',
                '[]'::jsonb
            ),
            custom_specialties = COALESCE(
                CASE WHEN jsonb_array_length(custom_specialties) > 0 THEN custom_specialties ELSE NULL END,
                registration_data->'custom_specialties',
                '[]'::jsonb
            ),
            services = COALESCE(
                CASE WHEN jsonb_array_length(services) > 0 THEN services ELSE NULL END,
                registration_data->'services',
                '[]'::jsonb
            ),
            custom_services = COALESCE(
                CASE WHEN jsonb_array_length(custom_services) > 0 THEN custom_services ELSE NULL END,
                registration_data->'custom_services',
                '[]'::jsonb
            ),
            operating_hours = COALESCE(
                operating_hours,
                registration_data->'operating_hours',
                '{
                    "monday": {"open": "08:00", "close": "18:00"},
                    "tuesday": {"open": "08:00", "close": "18:00"},
                    "wednesday": {"open": "08:00", "close": "18:00"},
                    "thursday": {"open": "08:00", "close": "18:00"},
                    "friday": {"open": "08:00", "close": "18:00"},
                    "saturday": {"open": "09:00", "close": "16:00"},
                    "sunday": {"open": "10:00", "close": "14:00"}
                }'::jsonb
            ),
            number_of_doctors = COALESCE(
                CASE WHEN number_of_doctors > 0 THEN number_of_doctors ELSE NULL END,
                (registration_data->>'number_of_doctors')::INTEGER,
                0
            ),
            number_of_staff = COALESCE(
                CASE WHEN number_of_staff > 0 THEN number_of_staff ELSE NULL END,
                (registration_data->>'number_of_staff')::INTEGER,
                0
            ),
            status = CASE 
                WHEN status = 'pending' THEN 'approved' 
                ELSE status 
            END,
            updated_at = NOW()
        WHERE id = clinic_id_param;
        
        RETURN QUERY SELECT TRUE, 'Clinic profile updated with registration data';
    ELSE
        -- Just update status to approved if no registration data
        UPDATE public.clinics SET
            status = 'approved',
            updated_at = NOW()
        WHERE id = clinic_id_param AND status = 'pending';
        
        RETURN QUERY SELECT TRUE, 'Clinic status updated to approved';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 'Error: ' || SQLERRM;
END;
$$;

-- =================================================================================
-- PART 3: EXECUTE FIXES
-- =================================================================================

-- Create profiles for users missing them
DO $$
DECLARE
    user_record RECORD;
    result RECORD;
    fix_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Creating profiles for clinic users missing them...';
    
    FOR user_record IN 
        SELECT user_id, clinic_name, email 
        FROM missing_clinic_profiles 
    LOOP
        SELECT * INTO result 
        FROM create_clinic_profile_from_metadata(user_record.user_id);
        
        IF result.success THEN
            fix_count := fix_count + 1;
            RAISE NOTICE 'Created profile for user % (%): %', 
                user_record.email, user_record.user_id, result.message;
        ELSE
            RAISE WARNING 'Failed to create profile for user % (%): %', 
                user_record.email, user_record.user_id, result.message;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully created % clinic profiles', fix_count;
END;
$$;

-- Update incomplete profiles
DO $$
DECLARE
    clinic_record RECORD;
    result RECORD;
    update_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Updating incomplete clinic profiles...';
    
    FOR clinic_record IN 
        SELECT id, clinic_name, user_email 
        FROM incomplete_clinic_profiles 
    LOOP
        SELECT * INTO result 
        FROM update_incomplete_clinic_profile(clinic_record.id);
        
        IF result.success THEN
            update_count := update_count + 1;
            RAISE NOTICE 'Updated profile for clinic % (%): %', 
                clinic_record.clinic_name, clinic_record.id, result.message;
        ELSE
            RAISE WARNING 'Failed to update profile for clinic % (%): %', 
                clinic_record.clinic_name, clinic_record.id, result.message;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully updated % clinic profiles', update_count;
END;
$$;

-- Update all remaining pending clinics to approved status
UPDATE public.clinics 
SET status = 'approved', updated_at = NOW() 
WHERE status = 'pending';

-- =================================================================================
-- PART 4: VERIFICATION QUERIES
-- =================================================================================

-- Show summary of fixes applied
SELECT 
    'Total clinic users' as category,
    COUNT(*) as count
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'clinic'
    AND email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
    'Clinic users with profiles' as category,
    COUNT(*) as count
FROM auth.users u
JOIN public.clinics c ON c.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'clinic'
    AND u.email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
    'Approved clinic profiles' as category,
    COUNT(*) as count
FROM public.clinics 
WHERE status = 'approved'

UNION ALL

SELECT 
    'Pending clinic profiles' as category,
    COUNT(*) as count
FROM public.clinics 
WHERE status = 'pending';

-- Show any remaining issues
SELECT 
    'Users still missing profiles' as issue_type,
    COUNT(*) as count
FROM missing_clinic_profiles

UNION ALL

SELECT 
    'Profiles still incomplete' as issue_type,
    COUNT(*) as count
FROM incomplete_clinic_profiles;

-- =================================================================================
-- PART 5: CLEANUP
-- =================================================================================

-- Drop temporary views
DROP VIEW IF EXISTS missing_clinic_profiles;
DROP VIEW IF EXISTS incomplete_clinic_profiles;

-- The functions can be kept for future manual fixes if needed
-- DROP FUNCTION IF EXISTS create_clinic_profile_from_metadata(UUID);
-- DROP FUNCTION IF EXISTS update_incomplete_clinic_profile(UUID);

RAISE NOTICE 'Clinic registration fix script completed successfully!';