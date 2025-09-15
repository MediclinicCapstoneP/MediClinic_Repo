-- Minimal Medical History Fix
-- This script fixes ONLY the immediate errors without creating triggers or policies

-- 1. Fix insurance_info table - Add missing is_primary column
DO $$ 
BEGIN
    -- Only add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'insurance_info' 
        AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE public.insurance_info ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Fix medical_records table - Add appointment_id if missing
DO $$ 
BEGIN 
    -- Only add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'medical_records' 
        AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN appointment_id UUID;
    END IF;
END $$;

-- 3. Add visit_date column if missing (needed for queries)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'medical_records' 
        AND column_name = 'visit_date'
    ) THEN
        ALTER TABLE public.medical_records ADD COLUMN visit_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 4. Create basic tables if they don't exist (minimal structure)
CREATE TABLE IF NOT EXISTS public.insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    provider_name TEXT,
    policy_number TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    clinic_id UUID,
    appointment_id UUID,
    visit_date DATE DEFAULT CURRENT_DATE,
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    test_name TEXT,
    test_date DATE DEFAULT CURRENT_DATE,
    results TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    vaccine_name TEXT,
    administration_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    allergen TEXT,
    severity TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    name TEXT,
    phone TEXT,
    relationship TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create basic indexes (no conflicts)
CREATE INDEX IF NOT EXISTS idx_insurance_info_patient ON public.insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_patient ON public.vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON public.allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient ON public.emergency_contacts(patient_id);

SELECT 'Minimal medical history fix completed - no triggers or policies created!' as status;