-- QUICK FIX: Add missing confirmation and reminder columns to appointments table
-- This fixes the PGRST204 error: "Could not find the 'confirmation_sent' column"

-- ===================================================================
-- ADD MISSING NOTIFICATION COLUMNS
-- ===================================================================

-- Add confirmation_sent column if it doesn't exist
DO $$
BEGIN
    -- Check if confirmation_sent column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'confirmation_sent'
    ) THEN
        -- Add confirmation_sent column as BOOLEAN with default FALSE
        ALTER TABLE public.appointments 
        ADD COLUMN confirmation_sent BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✅ Added confirmation_sent column to appointments table';
    ELSE
        RAISE NOTICE '✅ confirmation_sent column already exists';
    END IF;
END $$;

-- Add confirmation_sent_at column if it doesn't exist
DO $$
BEGIN
    -- Check if confirmation_sent_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'confirmation_sent_at'
    ) THEN
        -- Add confirmation_sent_at column as TIMESTAMP
        ALTER TABLE public.appointments 
        ADD COLUMN confirmation_sent_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Added confirmation_sent_at column to appointments table';
    ELSE
        RAISE NOTICE '✅ confirmation_sent_at column already exists';
    END IF;
END $$;

-- Add reminder_sent column if it doesn't exist
DO $$
BEGIN
    -- Check if reminder_sent column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'reminder_sent'
    ) THEN
        -- Add reminder_sent column as BOOLEAN with default FALSE
        ALTER TABLE public.appointments 
        ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✅ Added reminder_sent column to appointments table';
    ELSE
        RAISE NOTICE '✅ reminder_sent column already exists';
    END IF;
END $$;

-- Add reminder_sent_at column if it doesn't exist
DO $$
BEGIN
    -- Check if reminder_sent_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'reminder_sent_at'
    ) THEN
        -- Add reminder_sent_at column as TIMESTAMP
        ALTER TABLE public.appointments 
        ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Added reminder_sent_at column to appointments table';
    ELSE
        RAISE NOTICE '✅ reminder_sent_at column already exists';
    END IF;
END $$;

-- Add cancelled_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Added cancelled_at column to appointments table';
    ELSE
        RAISE NOTICE '✅ cancelled_at column already exists';
    END IF;
END $$;

-- Add cancelled_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN cancelled_by UUID;
        
        RAISE NOTICE '✅ Added cancelled_by column to appointments table';
    ELSE
        RAISE NOTICE '✅ cancelled_by column already exists';
    END IF;
END $$;

-- Add cancellation_reason column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN cancellation_reason TEXT;
        
        RAISE NOTICE '✅ Added cancellation_reason column to appointments table';
    ELSE
        RAISE NOTICE '✅ cancellation_reason column already exists';
    END IF;
END $$;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
AND column_name IN (
    'confirmation_sent', 'confirmation_sent_at', 'reminder_sent', 'reminder_sent_at',
    'cancelled_at', 'cancelled_by', 'cancellation_reason'
)
ORDER BY column_name;

-- Show count of appointments with notification status
SELECT 
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN confirmation_sent = true THEN 1 END) as confirmed_appointments,
    COUNT(CASE WHEN reminder_sent = true THEN 1 END) as reminded_appointments
FROM public.appointments;

-- Show sample data with new columns
SELECT 
    id,
    patient_id,
    appointment_date,
    appointment_time,
    status,
    confirmation_sent,
    confirmation_sent_at,
    reminder_sent,
    reminder_sent_at,
    cancelled_at,
    cancelled_by,
    cancellation_reason
FROM public.appointments 
ORDER BY created_at DESC
LIMIT 5;