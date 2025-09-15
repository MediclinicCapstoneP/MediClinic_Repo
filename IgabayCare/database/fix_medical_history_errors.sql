-- Fix Medical History Database Issues
-- This script addresses the specific errors in the medical history service

-- 1. Fix insurance_info table - Add missing is_primary column
ALTER TABLE public.insurance_info 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Update existing records to have a primary insurance
UPDATE public.insurance_info 
SET is_primary = true 
WHERE id IN (
    SELECT DISTINCT ON (patient_id) id 
    FROM public.insurance_info 
    ORDER BY patient_id, created_at ASC
);

-- 2. Fix medical_records table - Add appointment_id foreign key if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE public.medical_records 
        ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Fix medical_records table structure to match expected schema
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'visit_date') THEN
        ALTER TABLE public.medical_records ADD COLUMN visit_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'chief_complaint') THEN
        ALTER TABLE public.medical_records ADD COLUMN chief_complaint TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'vital_signs') THEN
        ALTER TABLE public.medical_records ADD COLUMN vital_signs JSONB;
    END IF;
END $$;

-- 4. Create the missing tables if they don't exist (from missing_tables.sql)

-- Medical Records table with proper structure
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

-- Insurance info table with proper structure
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

-- Lab results table
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    test_type TEXT,
    test_date DATE NOT NULL,
    results JSONB,
    reference_range TEXT,
    units TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'abnormal', 'critical')),
    lab_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccination records table
CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT,
    dose_number INTEGER,
    total_doses INTEGER,
    administration_date DATE NOT NULL,
    next_dose_date DATE,
    lot_number TEXT,
    manufacturer TEXT,
    site TEXT,
    route TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allergies table
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    allergy_type TEXT CHECK (allergy_type IN ('food', 'medication', 'environmental', 'other')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
    reaction_description TEXT,
    onset_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts table
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

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_id ON public.medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON public.medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON public.medical_records(visit_date);

CREATE INDEX IF NOT EXISTS idx_insurance_info_patient_id ON public.insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_info_is_primary ON public.insurance_info(is_primary);

CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_date ON public.lab_results(test_date);

CREATE INDEX IF NOT EXISTS idx_vaccination_records_patient_id ON public.vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_date ON public.vaccination_records(administration_date);

CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON public.allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_is_active ON public.allergies(is_active);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON public.emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON public.emergency_contacts(is_primary);

-- 6. Enable RLS on all tables
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for medical records
-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view their own medical records" ON public.medical_records;
CREATE POLICY "Users can view their own medical records" ON public.medical_records
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can view their patients' medical records" ON public.medical_records;
CREATE POLICY "Doctors can view their patients' medical records" ON public.medical_records
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can insert medical records" ON public.medical_records;
CREATE POLICY "Doctors can insert medical records" ON public.medical_records
    FOR INSERT WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can update their own medical records" ON public.medical_records;
CREATE POLICY "Doctors can update their own medical records" ON public.medical_records
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- 8. Create RLS policies for insurance info
DROP POLICY IF EXISTS "Users can view their own insurance info" ON public.insurance_info;
CREATE POLICY "Users can view their own insurance info" ON public.insurance_info
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own insurance info" ON public.insurance_info;
CREATE POLICY "Users can manage their own insurance info" ON public.insurance_info
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

-- 9. Create similar policies for other tables
DROP POLICY IF EXISTS "Users can view their own lab results" ON public.lab_results;
CREATE POLICY "Users can view their own lab results" ON public.lab_results
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own vaccination records" ON public.vaccination_records;
CREATE POLICY "Users can view their own vaccination records" ON public.vaccination_records
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own allergies" ON public.allergies;
CREATE POLICY "Users can view their own allergies" ON public.allergies
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own allergies" ON public.allergies;
CREATE POLICY "Users can manage their own allergies" ON public.allergies
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can view their own emergency contacts" ON public.emergency_contacts
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can manage their own emergency contacts" ON public.emergency_contacts
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

-- 10. Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON public.medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_insurance_info_updated_at ON public.insurance_info;
CREATE TRIGGER update_insurance_info_updated_at 
    BEFORE UPDATE ON public.insurance_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_results_updated_at ON public.lab_results;
CREATE TRIGGER update_lab_results_updated_at 
    BEFORE UPDATE ON public.lab_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaccination_records_updated_at ON public.vaccination_records;
CREATE TRIGGER update_vaccination_records_updated_at 
    BEFORE UPDATE ON public.vaccination_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_allergies_updated_at ON public.allergies;
CREATE TRIGGER update_allergies_updated_at 
    BEFORE UPDATE ON public.allergies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at 
    BEFORE UPDATE ON public.emergency_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_info TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccination_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;

SELECT 'Medical history database schema fixed successfully!' as status;