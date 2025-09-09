-- Update Clinics Table to Support Location Data
-- Run this script in your Supabase SQL Editor to add latitude/longitude support

-- 1. Add latitude and longitude columns if they don't exist
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8);

-- 2. Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Update the public view to include location data
DROP VIEW IF EXISTS public_clinics_view;
CREATE VIEW public_clinics_view AS
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
    latitude,
    longitude,
    created_at
FROM clinics 
WHERE status = 'approved';

-- Grant access to the updated view
GRANT SELECT ON public_clinics_view TO authenticated;
GRANT SELECT ON public_clinics_view TO anon;

-- 4. Update the get_clinic_by_user_id function
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
    latitude numeric,
    longitude numeric,
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
        c.latitude,
        c.longitude,
        c.status,
        c.created_at,
        c.updated_at
    FROM clinics c
    WHERE c.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_clinic_by_user_id(uuid) TO authenticated;

-- 5. Update the search_clinics function
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
    latitude numeric,
    longitude numeric,
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
        c.latitude,
        c.longitude,
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

-- 6. Create function to search clinics by location proximity
CREATE OR REPLACE FUNCTION search_clinics_by_location(
    center_lat numeric,
    center_lng numeric,
    radius_km numeric DEFAULT 50,
    search_term text DEFAULT ''
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
    latitude numeric,
    longitude numeric,
    distance_km numeric
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
        c.latitude,
        c.longitude,
        -- Calculate distance using Haversine formula (approximate)
        (6371 * acos(cos(radians(center_lat)) * cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians(center_lng)) + 
        sin(radians(center_lat)) * sin(radians(c.latitude))))::numeric as distance_km
    FROM clinics c
    WHERE c.status = 'approved'
    AND c.latitude IS NOT NULL 
    AND c.longitude IS NOT NULL
    AND (
        search_term = '' OR 
        c.clinic_name ILIKE '%' || search_term || '%' OR
        c.description ILIKE '%' || search_term || '%'
    )
    HAVING distance_km <= radius_km
    ORDER BY distance_km, c.clinic_name;
END;
$$ language 'plpgsql';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_clinics_by_location(numeric, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_clinics_by_location(numeric, numeric, numeric, text) TO anon;

-- Success message
SELECT 'Clinic location features successfully added! Latitude and longitude columns are now available.' as status;
