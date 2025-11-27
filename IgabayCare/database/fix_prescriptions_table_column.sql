-- ===================================================================
-- FIX PRESCRIPTIONS TABLE - ADD MISSING prescribing_doctor_name COLUMN
-- ===================================================================
-- This script fixes the missing prescribing_doctor_name column error

-- Check if prescribing_doctor_name column exists, if not add it
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'prescribing_doctor_name'
    ) THEN
        -- Add the missing column
        ALTER TABLE public.prescriptions 
        ADD COLUMN prescribing_doctor_name TEXT NOT NULL DEFAULT 'Unknown Doctor';
        
        RAISE NOTICE '✅ Added prescribing_doctor_name column to prescriptions table';
    ELSE
        RAISE NOTICE '✅ prescribing_doctor_name column already exists in prescriptions table';
    END IF;
END $$;

-- Update any existing records that might have NULL prescribing_doctor_name
UPDATE public.prescriptions 
SET prescribing_doctor_name = 'Unknown Doctor' 
WHERE prescribing_doctor_name IS NULL OR prescribing_doctor_name = '';

-- Ensure the column is NOT NULL
ALTER TABLE public.prescriptions 
ALTER COLUMN prescribing_doctor_name SET NOT NULL;

-- Add other commonly missing prescription columns if they don't exist
DO $$
BEGIN
    -- Add prescribing_doctor_license if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'prescribing_doctor_license'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN prescribing_doctor_license TEXT;
        RAISE NOTICE '✅ Added prescribing_doctor_license column';
    END IF;

    -- Add doctor_specialty if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'doctor_specialty'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN doctor_specialty TEXT;
        RAISE NOTICE '✅ Added doctor_specialty column';
    END IF;

    -- Add diagnosis if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'diagnosis'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN diagnosis TEXT;
        RAISE NOTICE '✅ Added diagnosis column';
    END IF;

    -- Add general_instructions if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'general_instructions'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN general_instructions TEXT;
        RAISE NOTICE '✅ Added general_instructions column';
    END IF;

    -- Add valid_until if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN valid_until DATE;
        RAISE NOTICE '✅ Added valid_until column';
    END IF;

    -- Add prescription_number if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prescriptions' 
        AND column_name = 'prescription_number'
    ) THEN
        ALTER TABLE public.prescriptions 
        ADD COLUMN prescription_number TEXT UNIQUE DEFAULT ('RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'));
        RAISE NOTICE '✅ Added prescription_number column';
    END IF;
END $$;

-- Create prescription_medications table if it doesn't exist
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prescription_medications_prescription_id_fkey'
        AND table_name = 'prescription_medications'
    ) THEN
        ALTER TABLE public.prescription_medications 
        ADD CONSTRAINT prescription_medications_prescription_id_fkey 
        FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint for prescription_medications';
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_medications TO authenticated;

-- Verify the fix
SELECT 
    'Prescriptions Table Columns' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ Prescriptions table fix completed successfully!' as status;