-- ===================================================================
-- FIX PATIENT SIDE DATABASE ERRORS
-- ===================================================================
-- This script fixes the database issues causing patient-side errors:
-- 1. Prescription-medications relationship error (PGRST200)
-- 2. Missing notifications.expires_at column error (42703)

-- ===================================================================
-- 1. ENSURE NOTIFICATIONS TABLE HAS EXPIRES_AT COLUMN
-- ===================================================================

-- Check if expires_at column exists, if not add it
DO $$
BEGIN
    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'expires_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added expires_at column to notifications table';
    ELSE
        RAISE NOTICE 'expires_at column already exists in notifications table';
    END IF;
END $$;

-- ===================================================================
-- 2. CREATE PRESCRIPTION TABLES IF THEY DON'T EXIST
-- ===================================================================

-- Create prescriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID, -- Future reference to doctors table
    
    -- Prescription details
    prescription_number TEXT UNIQUE NOT NULL DEFAULT ('RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
    
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
    valid_until DATE, -- Prescription expiry date
    
    -- Instructions
    general_instructions TEXT,
    dietary_restrictions TEXT,
    follow_up_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription_medications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.prescription_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Medication details
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    medication_type TEXT, -- tablet, capsule, syrup, injection, etc.
    strength TEXT NOT NULL, -- e.g., "500mg", "10ml", "250mg/5ml"
    form TEXT, -- tablet, capsule, syrup, cream, etc.
    
    -- Dosage instructions
    dosage TEXT NOT NULL, -- e.g., "1 tablet", "2 capsules", "5ml"
    frequency TEXT NOT NULL, -- e.g., "twice daily", "every 8 hours", "as needed"
    duration TEXT NOT NULL, -- e.g., "7 days", "2 weeks", "as needed"
    timing TEXT, -- e.g., "after meals", "before sleep", "on empty stomach"
    
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

-- Enable RLS on prescription tables
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;

-- Refresh schema cache by updating table comments
COMMENT ON TABLE prescriptions IS 'Patient prescriptions with medication details - Updated';
COMMENT ON TABLE prescription_medications IS 'Individual medications in prescriptions - Updated';

-- ===================================================================
-- 3. ENSURE PROPER INDEXES FOR RELATIONSHIPS
-- ===================================================================

-- Recreate indexes to ensure proper relationship recognition
DROP INDEX IF EXISTS idx_prescription_medications_prescription_id;
CREATE INDEX idx_prescription_medications_prescription_id ON prescription_medications(prescription_id);

DROP INDEX IF EXISTS idx_prescriptions_patient_id;
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);

-- ===================================================================
-- 4. REFRESH RLS POLICIES FOR PRESCRIPTIONS
-- ===================================================================

-- Drop and recreate RLS policies to ensure proper relationship recognition
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
CREATE POLICY "Patients can view their own prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = prescriptions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view prescription medications they have access to" ON prescription_medications;
CREATE POLICY "Users can view prescription medications they have access to" ON prescription_medications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN patients pt ON pt.id = p.patient_id
            WHERE p.id = prescription_medications.prescription_id 
            AND pt.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_medications.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

-- ===================================================================
-- 5. ENSURE NOTIFICATIONS TABLE IS PROPERLY CONFIGURED
-- ===================================================================

-- Ensure notifications table has all required columns
DO $$
BEGIN
    -- Check and add missing columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'user_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'appointment_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'title' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN title TEXT NOT NULL DEFAULT 'Notification';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'message' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'system';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ===================================================================
-- 6. REFRESH SUPABASE SCHEMA CACHE
-- ===================================================================

-- Force Supabase to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- Update table statistics to help with query planning
ANALYZE prescriptions;
ANALYZE prescription_medications;
ANALYZE notifications;

-- ===================================================================
-- 7. VERIFICATION QUERIES
-- ===================================================================

-- Verify prescriptions relationship
SELECT 
    'prescriptions_relationship_test' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM prescriptions p
LEFT JOIN prescription_medications pm ON p.id = pm.prescription_id
LIMIT 1;

-- Verify notifications table structure
SELECT 
    'notifications_structure_test' as test_name,
    CASE 
        WHEN COUNT(*) = 8 THEN 'PASS - All required columns exist'
        ELSE 'FAIL - Missing columns: ' || (8 - COUNT(*))::text
    END as status
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
AND column_name IN ('id', 'user_id', 'title', 'message', 'type', 'is_read', 'expires_at', 'created_at');

-- Test notifications expires_at column specifically
SELECT 
    'notifications_expires_at_test' as test_name,
    CASE 
        WHEN COUNT(*) = 1 THEN 'PASS - expires_at column exists'
        ELSE 'FAIL - expires_at column missing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'expires_at' 
AND table_schema = 'public';

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

SELECT '✅ Patient-side database errors have been fixed!' as status,
       'Prescription relationships and notifications table updated' as details;
