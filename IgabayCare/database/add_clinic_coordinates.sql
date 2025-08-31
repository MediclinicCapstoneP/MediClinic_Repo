-- ===================================================================
-- ADD LATITUDE AND LONGITUDE COLUMNS TO CLINICS TABLE
-- ===================================================================

-- Add latitude and longitude columns to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_clinics_coordinates ON clinics(latitude, longitude);

-- Update the existing OHARA clinic with coordinates (Manila, Philippines area)
UPDATE public.clinics 
SET 
    latitude = 14.5995,
    longitude = 120.9842
WHERE id = '19631e43-5e2c-466d-84bc-9199123260d2';

-- Verify the update
SELECT 
    clinic_name, 
    address, 
    city, 
    latitude, 
    longitude 
FROM public.clinics 
WHERE id = '19631e43-5e2c-466d-84bc-9199123260d2';
