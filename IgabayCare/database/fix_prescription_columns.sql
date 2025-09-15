-- Fix missing prescription columns
-- This script adds any missing columns that the prescription system expects

-- 1. Add missing columns to prescriptions table if they don't exist
DO $$
BEGIN
    -- Add clinical_notes column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'clinical_notes'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN clinical_notes TEXT;
    END IF;
    
    -- Add patient_symptoms column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'patient_symptoms'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN patient_symptoms TEXT;
    END IF;
    
    -- Add general_instructions column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'general_instructions'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN general_instructions TEXT;
    END IF;
    
    -- Add dietary_restrictions column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'dietary_restrictions'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN dietary_restrictions TEXT;
    END IF;
    
    -- Add follow_up_instructions column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'follow_up_instructions'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN follow_up_instructions TEXT;
    END IF;
    
    -- Add doctor_specialty column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'doctor_specialty'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN doctor_specialty TEXT;
    END IF;
    
    -- Add prescribing_doctor_license column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'prescribing_doctor_license'
    ) THEN
        ALTER TABLE public.prescriptions ADD COLUMN prescribing_doctor_license TEXT;
    END IF;
END $$;

-- 2. Ensure prescriptions table exists with basic structure
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID,
    patient_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    doctor_id UUID,
    
    -- Prescription details
    prescription_number TEXT UNIQUE NOT NULL,
    
    -- Doctor information
    prescribing_doctor_name TEXT NOT NULL,
    prescribing_doctor_license TEXT,
    doctor_specialty TEXT,
    
    -- Prescription metadata
    diagnosis TEXT,
    patient_symptoms TEXT,
    clinical_notes TEXT,
    
    -- Prescription status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    
    -- Dates
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Instructions
    general_instructions TEXT,
    dietary_restrictions TEXT,
    follow_up_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure prescription_medications table exists
CREATE TABLE IF NOT EXISTS public.prescription_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    prescription_id UUID NOT NULL,
    
    -- Medication details
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    medication_type TEXT,
    strength TEXT NOT NULL,
    form TEXT,
    
    -- Dosage instructions
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    timing TEXT,
    
    -- Additional instructions
    special_instructions TEXT,
    side_effects TEXT,
    precautions TEXT,
    
    -- Quantities
    quantity_prescribed INTEGER NOT NULL DEFAULT 1,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for prescription_medications.prescription_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prescription_medications_prescription_id_fkey'
        AND table_name = 'prescription_medications'
    ) THEN
        ALTER TABLE public.prescription_medications 
        ADD CONSTRAINT prescription_medications_prescription_id_fkey 
        FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for prescriptions.patient_id if it doesn't exist and patients table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients')
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prescriptions_patient_id_fkey'
        AND table_name = 'prescriptions'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD CONSTRAINT prescriptions_patient_id_fkey 
        FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for prescriptions.clinic_id if it doesn't exist and clinics table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinics')
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prescriptions_clinic_id_fkey'
        AND table_name = 'prescriptions'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD CONSTRAINT prescriptions_clinic_id_fkey 
        FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for prescriptions.appointment_id if it doesn't exist and appointments table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments')
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prescriptions_appointment_id_fkey'
        AND table_name = 'prescriptions'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD CONSTRAINT prescriptions_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON public.prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON public.prescriptions(prescribed_date);

CREATE INDEX IF NOT EXISTS idx_prescription_medications_prescription_id ON public.prescription_medications(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_medications_medication_name ON public.prescription_medications(medication_name);
CREATE INDEX IF NOT EXISTS idx_prescription_medications_status ON public.prescription_medications(status);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_medications TO authenticated;

SELECT 'Prescription columns and tables fixed successfully!' as status;