-- Fix Appointments Table - Add doctor_id Column
-- This script addresses the missing doctor_id column error

-- ===================================================================
-- STEP 1: ADD MISSING doctor_id COLUMN
-- ===================================================================

-- Check if doctor_id column exists and add it if missing
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
        ADD COLUMN doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added doctor_id column to appointments table';
    ELSE
        RAISE NOTICE 'doctor_id column already exists in appointments table';
    END IF;
END $$;

-- ===================================================================
-- STEP 2: ADD PAYMENT AMOUNT COLUMN
-- ===================================================================

-- Check if payment_amount column exists and add it if missing
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
        
        RAISE NOTICE 'Added payment_amount column to appointments table';
    ELSE
        RAISE NOTICE 'payment_amount column already exists in appointments table';
    END IF;
END $$;

-- ===================================================================
-- STEP 3: CREATE INDEX FOR PERFORMANCE
-- ===================================================================

-- Add index on doctor_id for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_appointments_doctor_id'
    ) THEN
        CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
        RAISE NOTICE 'Added index on appointments.doctor_id';
    ELSE
        RAISE NOTICE 'Index on appointments.doctor_id already exists';
    END IF;
END $$;

-- Add index on clinic_id for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_appointments_clinic_id'
    ) THEN
        CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
        RAISE NOTICE 'Added index on appointments.clinic_id';
    ELSE
        RAISE NOTICE 'Index on appointments.clinic_id already exists';
    END IF;
END $$;

-- ===================================================================
-- STEP 4: UPDATE EXISTING APPOINTMENTS WITH doctor_name
-- ===================================================================

-- Try to match existing doctor_name with actual doctor records
-- This will populate doctor_id where possible based on doctor_name
UPDATE public.appointments 
SET doctor_id = d.id
FROM public.doctors d
WHERE appointments.doctor_name IS NOT NULL 
AND appointments.doctor_id IS NULL
AND TRIM(appointments.doctor_name) = TRIM(d.full_name);

-- ===================================================================
-- STEP 5: VERIFICATION QUERIES
-- ===================================================================

-- Verify the schema changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
AND column_name IN ('doctor_id', 'payment_amount', 'doctor_name')
ORDER BY column_name;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND indexname LIKE '%doctor%' OR indexname LIKE '%clinic%';

-- Show sample data with new columns
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
    created_at
FROM public.appointments 
ORDER BY created_at DESC 
LIMIT 5;

RAISE NOTICE 'Appointments table schema fix completed successfully!';
RAISE NOTICE 'doctor_id column added with foreign key reference to doctors table';
RAISE NOTICE 'payment_amount column added for booking fees';
RAISE NOTICE 'Performance indexes created for better query speed';