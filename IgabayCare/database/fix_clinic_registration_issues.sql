-- Fix Clinic Registration Issues
-- This script addresses the issue where clinic users are created in auth.users but not in the clinics table

-- Enable Row Level Security if not already enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clinic owners can insert their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can select their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can update their clinics" ON clinics;
DROP POLICY IF EXISTS "Clinic owners can delete their clinics" ON clinics;
DROP POLICY IF EXISTS "Public can view approved clinics" ON clinics;
DROP POLICY IF EXISTS "Authenticated users can view all clinics" ON clinics;

-- Create comprehensive RLS policies for clinics

-- 1. Allow clinic owners to INSERT their own clinics
CREATE POLICY "Clinic owners can insert their clinics" ON clinics
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- 2. Allow clinic owners to SELECT their own clinics
CREATE POLICY "Clinic owners can select their clinics" ON clinics
    FOR SELECT USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- 3. Allow clinic owners to UPDATE their own clinics
CREATE POLICY "Clinic owners can update their clinics" ON clinics
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- 4. Allow clinic owners to DELETE their own clinics
CREATE POLICY "Clinic owners can delete their clinics" ON clinics
    FOR DELETE USING (
        user_id = auth.uid() AND 
        auth.role() = 'authenticated'
    );

-- 5. Allow public users to view approved clinics (for patient search)
CREATE POLICY "Public can view approved clinics" ON clinics
    FOR SELECT USING (
        status = 'approved'
    );

-- Create a function to help create missing clinic profiles
CREATE OR REPLACE FUNCTION create_missing_clinic_profile(
    p_user_id UUID,
    p_clinic_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_clinic_id UUID;
    user_email TEXT;
    clinic_name TEXT;
BEGIN
    -- Get user email if not provided
    IF p_email IS NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    ELSE
        user_email := p_email;
    END IF;
    
    -- Get clinic name from user metadata if not provided
    IF p_clinic_name IS NULL THEN
        SELECT COALESCE(
            raw_user_meta_data->>'clinic_name',
            raw_user_meta_data->>'first_name',
            'My Clinic'
        ) INTO clinic_name 
        FROM auth.users 
        WHERE id = p_user_id;
    ELSE
        clinic_name := p_clinic_name;
    END IF;
    
    -- Check if clinic already exists
    SELECT id INTO new_clinic_id FROM clinics WHERE user_id = p_user_id;
    
    IF new_clinic_id IS NOT NULL THEN
        RAISE NOTICE 'Clinic profile already exists for user %', p_user_id;
        RETURN new_clinic_id;
    END IF;
    
    -- Create clinic profile
    INSERT INTO clinics (
        user_id,
        clinic_name,
        email,
        specialties,
        custom_specialties,
        services,
        custom_services,
        operating_hours,
        number_of_doctors,
        number_of_staff,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        clinic_name,
        user_email,
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        jsonb_build_object(
            'monday', jsonb_build_object('open', '08:00', 'close', '18:00'),
            'tuesday', jsonb_build_object('open', '08:00', 'close', '18:00'),
            'wednesday', jsonb_build_object('open', '08:00', 'close', '18:00'),
            'thursday', jsonb_build_object('open', '08:00', 'close', '18:00'),
            'friday', jsonb_build_object('open', '08:00', 'close', '18:00'),
            'saturday', jsonb_build_object('open', '09:00', 'close', '16:00'),
            'sunday', jsonb_build_object('open', '10:00', 'close', '14:00')
        ),
        0,
        0,
        'pending',
        NOW(),
        NOW()
    ) RETURNING id INTO new_clinic_id;
    
    RAISE NOTICE 'Created clinic profile % for user %', new_clinic_id, p_user_id;
    RETURN new_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles for existing clinic users who don't have clinic profiles
DO $$
DECLARE
    user_record RECORD;
    clinic_id UUID;
BEGIN
    -- Find all authenticated users with clinic role who don't have clinic profiles
    FOR user_record IN 
        SELECT 
            u.id,
            u.email,
            u.raw_user_meta_data->>'clinic_name' as clinic_name
        FROM auth.users u
        LEFT JOIN clinics c ON c.user_id = u.id
        WHERE u.raw_user_meta_data->>'role' = 'clinic'
        AND c.id IS NULL
        AND u.email_confirmed_at IS NOT NULL
    LOOP
        BEGIN
            -- Create clinic profile for this user
            SELECT create_missing_clinic_profile(
                user_record.id,
                user_record.clinic_name,
                user_record.email
            ) INTO clinic_id;
            
            RAISE NOTICE 'Created clinic profile for user % (email: %)', user_record.id, user_record.email;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create clinic profile for user % (email: %): %', 
                    user_record.id, user_record.email, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Show results
SELECT 
    'Clinic users without profiles:' as info,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN clinics c ON c.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'clinic'
AND c.id IS NULL
AND u.email_confirmed_at IS NOT NULL;

SELECT 
    'Total clinic profiles:' as info,
    COUNT(*) as count
FROM clinics;

SELECT 
    'Clinic users with profiles:' as info,
    COUNT(*) as count
FROM auth.users u
INNER JOIN clinics c ON c.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'clinic';

-- Verify policies are working
SELECT 
    'RLS Policies for clinics:' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'clinics';