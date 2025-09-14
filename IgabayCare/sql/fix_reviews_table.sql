-- Fix the existing reviews table to add missing columns needed by the application
-- This script updates your existing reviews table to work with the application

-- Add missing columns that the application expects
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS title varchar(200);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS comment text;

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS wait_time_rating integer CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS staff_friendliness_rating integer CHECK (staff_friendliness_rating >= 1 AND staff_friendliness_rating <= 5);

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden', 'deleted'));

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS appointment_id uuid;

-- Add foreign key constraint for appointment_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reviews_appointment_id_fkey' 
        AND table_name = 'reviews'
    ) THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT reviews_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing records to have the new required columns
UPDATE public.reviews 
SET 
    overall_rating = rating,
    status = 'active'
WHERE overall_rating IS NULL OR status IS NULL;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON public.reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON public.reviews(appointment_id);

-- Update the RLS policies to work with the existing table structure
-- Drop existing policies first
DROP POLICY IF EXISTS "Patients can create and view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clinics can view their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Doctors can view their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view active reviews" ON public.reviews;

-- Create new RLS policies that work with your schema
CREATE POLICY "Patients can create and view own reviews" ON public.reviews
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.patients WHERE id = reviews.patient_id
    )
  );

CREATE POLICY "Clinics can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.clinics WHERE id = reviews.clinic_id
    )
  );

CREATE POLICY "Doctors can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.doctors WHERE id = reviews.doctor_id
    )
  );

CREATE POLICY "Public can view active reviews" ON public.reviews
  FOR SELECT USING (
    (status IS NULL OR status = 'active') AND is_verified = true
  );

-- Ensure RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Add some sample data to test (optional - you can remove this section)
-- Using existing UUIDs from your tables if they exist
INSERT INTO public.reviews (
    patient_id, 
    clinic_id, 
    doctor_id, 
    rating, 
    overall_rating, 
    title, 
    comment, 
    status, 
    is_verified
)
SELECT 
    p.id as patient_id,
    c.id as clinic_id,
    d.id as doctor_id,
    5 as rating,
    5 as overall_rating,
    'Great Service!' as title,
    'Excellent experience with professional staff.' as comment,
    'active' as status,
    true as is_verified
FROM public.patients p
CROSS JOIN public.clinics c
CROSS JOIN public.doctors d
LIMIT 1
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;