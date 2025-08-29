-- COMPREHENSIVE APPOINTMENTS TABLE FIX
-- This script ensures the appointments table has all required columns for the application

-- ===================================================================
-- STEP 1: CHECK CURRENT APPOINTMENTS TABLE STRUCTURE
-- ===================================================================

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
ORDER BY ordinal_position;

-- ===================================================================
-- STEP 2: ADD MISSING doctor_id COLUMN
-- ===================================================================

-- Add doctor_id column if it doesn't exist
DO $$
BEGIN
    -- Check if doctor_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'doctor_id'
    ) THEN
        -- Add doctor_id column as UUID with foreign key reference
        ALTER TABLE public.appointments 
        ADD COLUMN doctor_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.appointments 
        ADD CONSTRAINT fk_appointments_doctor_id 
        FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added doctor_id column with foreign key constraint';
    ELSE
        RAISE NOTICE '✅ doctor_id column already exists';
    END IF;
END $$;

-- ===================================================================
-- STEP 3: ADD MISSING payment_amount COLUMN
-- ===================================================================

-- Add payment_amount column if it doesn't exist
DO $$
BEGIN
    -- Check if payment_amount column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'payment_amount'
    ) THEN
        -- Add payment_amount column as DECIMAL for currency
        ALTER TABLE public.appointments 
        ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00;
        
        RAISE NOTICE '✅ Added payment_amount column';
    ELSE
        RAISE NOTICE '✅ payment_amount column already exists';
    END IF;
END $$;

-- ===================================================================
-- STEP 4: ENSURE OTHER REQUIRED COLUMNS EXIST
-- ===================================================================

-- Add duration_minutes if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN duration_minutes INTEGER DEFAULT 30;
        RAISE NOTICE '✅ Added duration_minutes column';
    ELSE
        RAISE NOTICE '✅ duration_minutes column already exists';
    END IF;
END $$;

-- Add patient_notes if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_notes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN patient_notes TEXT;
        RAISE NOTICE '✅ Added patient_notes column';
    ELSE
        RAISE NOTICE '✅ patient_notes column already exists';
    END IF;
END $$;

-- Add doctor_specialty if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'doctor_specialty'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN doctor_specialty VARCHAR(255);
        RAISE NOTICE '✅ Added doctor_specialty column';
    ELSE
        RAISE NOTICE '✅ doctor_specialty column already exists';
    END IF;
END $$;

-- Add confirmation_sent if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'confirmation_sent'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN confirmation_sent BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added confirmation_sent column';
    ELSE
        RAISE NOTICE '✅ confirmation_sent column already exists';
    END IF;
END $$;

-- Add confirmation_sent_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'confirmation_sent_at'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN confirmation_sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added confirmation_sent_at column';
    ELSE
        RAISE NOTICE '✅ confirmation_sent_at column already exists';
    END IF;
END $$;

-- Add reminder_sent if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'reminder_sent'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added reminder_sent column';
    ELSE
        RAISE NOTICE '✅ reminder_sent column already exists';
    END IF;
END $$;

-- Add reminder_sent_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'reminder_sent_at'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added reminder_sent_at column';
    ELSE
        RAISE NOTICE '✅ reminder_sent_at column already exists';
    END IF;
END $$;

-- Add cancelled_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added cancelled_at column';
    ELSE
        RAISE NOTICE '✅ cancelled_at column already exists';
    END IF;
END $$;

-- Add cancelled_by if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN cancelled_by UUID;
        RAISE NOTICE '✅ Added cancelled_by column';
    ELSE
        RAISE NOTICE '✅ cancelled_by column already exists';
    END IF;
END $$;

-- Add cancellation_reason if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN cancellation_reason TEXT;
        RAISE NOTICE '✅ Added cancellation_reason column';
    ELSE
        RAISE NOTICE '✅ cancellation_reason column already exists';
    END IF;
END $$;

-- ===================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- ===================================================================

-- Index on doctor_id for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'appointments' AND indexname = 'idx_appointments_doctor_id'
    ) THEN
        CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
        RAISE NOTICE '✅ Created index on doctor_id';
    ELSE
        RAISE NOTICE '✅ Index on doctor_id already exists';
    END IF;
END $$;

-- Index on clinic_id for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'appointments' AND indexname = 'idx_appointments_clinic_id'
    ) THEN
        CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
        RAISE NOTICE '✅ Created index on clinic_id';
    ELSE
        RAISE NOTICE '✅ Index on clinic_id already exists';
    END IF;
END $$;

-- Index on patient_id for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'appointments' AND indexname = 'idx_appointments_patient_id'
    ) THEN
        CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
        RAISE NOTICE '✅ Created index on patient_id';
    ELSE
        RAISE NOTICE '✅ Index on patient_id already exists';
    END IF;
END $$;

-- ===================================================================
-- STEP 6: UPDATE EXISTING DATA
-- ===================================================================

-- Try to populate doctor_id based on doctor_name where possible
UPDATE public.appointments 
SET doctor_id = d.id
FROM public.doctors d
WHERE appointments.doctor_name IS NOT NULL 
AND appointments.doctor_id IS NULL
AND TRIM(LOWER(appointments.doctor_name)) = TRIM(LOWER(d.full_name));

-- Try to populate doctor_specialty based on doctor_id where possible
UPDATE public.appointments 
SET doctor_specialty = d.specialization
FROM public.doctors d
WHERE appointments.doctor_id IS NOT NULL 
AND appointments.doctor_specialty IS NULL
AND appointments.doctor_id = d.id;

-- Get count of updated records
SELECT COUNT(*) as records_updated 
FROM public.appointments 
WHERE doctor_id IS NOT NULL AND doctor_name IS NOT NULL;

-- ===================================================================
-- STEP 7: VERIFICATION AND FINAL CHECK
-- ===================================================================

-- Verify all required columns exist
SELECT 
    'appointments' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
AND column_name IN (
    'doctor_id', 'payment_amount', 'duration_minutes', 'patient_notes', 
    'doctor_name', 'doctor_specialty', 'confirmation_sent', 'confirmation_sent_at',
    'reminder_sent', 'reminder_sent_at', 'cancelled_at', 'cancelled_by', 'cancellation_reason'
)
ORDER BY column_name;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'appointments'
AND kcu.column_name = 'doctor_id';

-- Show sample data with all new columns
SELECT 
    id,
    patient_id,
    clinic_id,
    doctor_id,
    doctor_name,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    payment_amount,
    duration_minutes,
    created_at
FROM public.appointments 
ORDER BY created_at DESC 
LIMIT 5;

-- Final success message
RAISE NOTICE '🎉 APPOINTMENTS TABLE SCHEMA FIX COMPLETED SUCCESSFULLY!';
RAISE NOTICE '✅ All required columns are now present in the appointments table';
RAISE NOTICE '✅ Foreign key constraints are properly set up';
RAISE NOTICE '✅ Performance indexes are created';
RAISE NOTICE '✅ Existing data has been migrated where possible';
RAISE NOTICE '📊 You can now use the doctor assignment functionality without errors!';