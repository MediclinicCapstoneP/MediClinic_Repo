-- ===================================================================
-- FIX PRESCRIPTIONS TABLE SCHEMA
-- ===================================================================
-- This script ensures the prescriptions table has all required columns
-- and fixes the PGRST204 error for missing columns

-- Add missing columns to prescriptions table if they don't exist
DO $$
BEGIN
    -- Add clinical_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'clinical_notes' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN clinical_notes TEXT;
        
        RAISE NOTICE 'Added clinical_notes column to prescriptions table';
    ELSE
        RAISE NOTICE 'clinical_notes column already exists in prescriptions table';
    END IF;

    -- Add patient_symptoms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'patient_symptoms' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN patient_symptoms TEXT;
        
        RAISE NOTICE 'Added patient_symptoms column to prescriptions table';
    ELSE
        RAISE NOTICE 'patient_symptoms column already exists in prescriptions table';
    END IF;

    -- Add diagnosis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'diagnosis' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN diagnosis TEXT;
        
        RAISE NOTICE 'Added diagnosis column to prescriptions table';
    ELSE
        RAISE NOTICE 'diagnosis column already exists in prescriptions table';
    END IF;

    -- Add doctor_specialty column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'doctor_specialty' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN doctor_specialty TEXT;
        
        RAISE NOTICE 'Added doctor_specialty column to prescriptions table';
    ELSE
        RAISE NOTICE 'doctor_specialty column already exists in prescriptions table';
    END IF;

    -- Add general_instructions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'general_instructions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN general_instructions TEXT;
        
        RAISE NOTICE 'Added general_instructions column to prescriptions table';
    ELSE
        RAISE NOTICE 'general_instructions column already exists in prescriptions table';
    END IF;

    -- Add dietary_restrictions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'dietary_restrictions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN dietary_restrictions TEXT;
        
        RAISE NOTICE 'Added dietary_restrictions column to prescriptions table';
    ELSE
        RAISE NOTICE 'dietary_restrictions column already exists in prescriptions table';
    END IF;

    -- Add follow_up_instructions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'follow_up_instructions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN follow_up_instructions TEXT;
        
        RAISE NOTICE 'Added follow_up_instructions column to prescriptions table';
    ELSE
        RAISE NOTICE 'follow_up_instructions column already exists in prescriptions table';
    END IF;

    -- Add prescribing_doctor_license column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'prescribing_doctor_license' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN prescribing_doctor_license TEXT;
        
        RAISE NOTICE 'Added prescribing_doctor_license column to prescriptions table';
    ELSE
        RAISE NOTICE 'prescribing_doctor_license column already exists in prescriptions table';
    END IF;

    -- Add valid_until column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'valid_until' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN valid_until DATE;
        
        RAISE NOTICE 'Added valid_until column to prescriptions table';
    ELSE
        RAISE NOTICE 'valid_until column already exists in prescriptions table';
    END IF;

    -- Add status column with proper constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescriptions' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired'));
        
        RAISE NOTICE 'Added status column to prescriptions table';
    ELSE
        RAISE NOTICE 'status column already exists in prescriptions table';
    END IF;

END $$;

-- Ensure the prescriptions table has proper indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON public.prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON public.prescriptions(prescribed_date);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

RAISE NOTICE 'Prescriptions table schema fix completed successfully';
