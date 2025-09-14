-- Create the reviews table for storing patient reviews and ratings
-- Run this in your Supabase SQL editor to create the missing reviews table

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  doctor_id UUID,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  
  -- Review categories
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  wait_time_rating INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  staff_friendliness_rating INTEGER CHECK (staff_friendliness_rating >= 1 AND staff_friendliness_rating <= 5),
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden', 'deleted')),
  is_anonymous BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id ON public.reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON public.reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON public.reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Add foreign key constraints (assuming your tables exist)
-- Uncomment these if you have the referenced tables
-- ALTER TABLE public.reviews 
--   ADD CONSTRAINT fk_reviews_clinic_id 
--   FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- ALTER TABLE public.reviews 
--   ADD CONSTRAINT fk_reviews_doctor_id 
--   FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;

-- ALTER TABLE public.reviews 
--   ADD CONSTRAINT fk_reviews_patient_id 
--   FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ALTER TABLE public.reviews 
--   ADD CONSTRAINT fk_reviews_appointment_id 
--   FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for patients: can create reviews for their own appointments and view their own reviews
CREATE POLICY "Patients can create and view own reviews" ON public.reviews
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.patients WHERE id = reviews.patient_id
    )
  );

-- Policy for clinics: can view reviews for their clinic
CREATE POLICY "Clinics can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.clinics WHERE id = reviews.clinic_id
    )
  );

-- Policy for doctors: can view reviews for appointments they handled
CREATE POLICY "Doctors can view their reviews" ON public.reviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.doctors WHERE id = reviews.doctor_id
    )
  );

-- Policy for public viewing (for non-hidden, active reviews)
CREATE POLICY "Public can view active reviews" ON public.reviews
  FOR SELECT USING (
    status = 'active' AND is_verified = true
  );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert some sample data (optional - remove if you don't want sample data)
INSERT INTO public.reviews (clinic_id, doctor_id, patient_id, rating, overall_rating, title, comment, status, is_verified)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 5, 5, 'Excellent Service', 'Great experience, highly recommend!', 'active', true),
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 4, 4, 'Very Good', 'Good service, minor wait time.', 'active', true),
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 3, 3, 'Average', 'Okay service, room for improvement.', 'active', true)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;