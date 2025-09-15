-- Simple Medical History Database Fix
-- This script contains only the essential fixes to resolve the immediate errors

-- 1. Fix insurance_info table - Add missing is_primary column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'insurance_info' 
        AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE public.insurance_info ADD COLUMN is_primary BOOLEAN DEFAULT false;
        
        -- Update existing records to have one primary insurance per patient
        UPDATE public.insurance_info 
        SET is_primary = true 
        WHERE id IN (
            SELECT DISTINCT ON (patient_id) id 
            FROM public.insurance_info 
            ORDER BY patient_id, created_at ASC
        );
    END IF;
END $$;

-- 2. Fix medical_records table - Add appointment_id if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'medical_records' 
        AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add other essential columns to medical_records
DO $$
BEGIN
    -- Add visit_date if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'medical_records' 
        AND column_name = 'visit_date'
    ) THEN
        ALTER TABLE public.medical_records ADD COLUMN visit_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add chief_complaint if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'medical_records' 
        AND column_name = 'chief_complaint'
    ) THEN
        ALTER TABLE public.medical_records ADD COLUMN chief_complaint TEXT;
    END IF;
END $$;

-- 4. Create insurance_info table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    member_id TEXT,
    coverage_type TEXT CHECK (coverage_type IN ('primary', 'secondary', 'tertiary')),
    effective_date DATE,
    expiry_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create medical_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription_notes TEXT,
    vital_signs JSONB,
    lab_results JSONB,
    notes TEXT,
    attachments TEXT[],
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create other essential tables
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    test_type TEXT,
    test_date DATE NOT NULL,
    results JSONB,
    reference_range TEXT,
    units TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'abnormal', 'critical')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT,
    dose_number INTEGER,
    administration_date DATE NOT NULL,
    next_dose_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    allergy_type TEXT CHECK (allergy_type IN ('food', 'medication', 'environmental', 'other')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
    reaction_description TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create essential indexes
CREATE INDEX IF NOT EXISTS idx_insurance_info_patient_id ON public.insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_patient_id ON public.vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON public.allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON public.emergency_contacts(patient_id);

-- 8. Enable RLS on tables (only if they exist)
DO $$
BEGIN
    -- Enable RLS on tables that exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medical_records') THEN
        ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_info') THEN
        ALTER TABLE public.insurance_info ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_results') THEN
        ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vaccination_records') THEN
        ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'allergies') THEN
        ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emergency_contacts') THEN
        ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 9. Create update triggers (drop existing first to avoid conflicts)
DO $$
BEGIN
    -- Create or replace the update function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
    
    -- Drop and create triggers for each table that exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medical_records') THEN
        DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
        CREATE TRIGGER update_medical_records_updated_at 
            BEFORE UPDATE ON public.medical_records 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_info') THEN
        DROP TRIGGER IF EXISTS update_insurance_info_updated_at ON public.insurance_info;
        CREATE TRIGGER update_insurance_info_updated_at 
            BEFORE UPDATE ON public.insurance_info 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_results') THEN
        DROP TRIGGER IF EXISTS update_lab_results_updated_at ON public.lab_results;
        CREATE TRIGGER update_lab_results_updated_at 
            BEFORE UPDATE ON public.lab_results 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vaccination_records') THEN
        DROP TRIGGER IF EXISTS update_vaccination_records_updated_at ON public.vaccination_records;
        CREATE TRIGGER update_vaccination_records_updated_at 
            BEFORE UPDATE ON public.vaccination_records 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'allergies') THEN
        DROP TRIGGER IF EXISTS update_allergies_updated_at ON public.allergies;
        CREATE TRIGGER update_allergies_updated_at 
            BEFORE UPDATE ON public.allergies 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emergency_contacts') THEN
        DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON public.emergency_contacts;
        CREATE TRIGGER update_emergency_contacts_updated_at 
            BEFORE UPDATE ON public.emergency_contacts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. Grant basic permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_info TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccination_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;

SELECT 'Simple medical history database fix completed successfully!' as status;