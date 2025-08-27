-- QUICK FIX: Add missing columns to appointments table
-- Run this in your Supabase SQL Editor to fix column errors
-- This script adds: patient_notes, duration_minutes, appointment_type, priority

-- Check if appointments table exists
SELECT 'Checking appointments table...' as status;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments'
) as table_exists;

-- Check if patient_notes column exists
SELECT 'Checking patient_notes column...' as status;

SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'patient_notes'
) as patient_notes_exists;

-- Add patient_notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'patient_notes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN patient_notes TEXT;
        RAISE NOTICE '✅ Added patient_notes column to appointments table';
    ELSE
        RAISE NOTICE 'ℹ️ patient_notes column already exists';
    END IF;
END $$;

-- Also add other commonly missing columns
DO $$ 
BEGIN
    -- Add duration_minutes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN duration_minutes INTEGER DEFAULT 30;
        RAISE NOTICE '✅ Added duration_minutes column to appointments table';
    END IF;
    
    -- Add appointment_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'appointment_type'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_type TEXT DEFAULT 'consultation';
        RAISE NOTICE '✅ Added appointment_type column to appointments table';
    END IF;
    
    -- Add priority if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN priority TEXT DEFAULT 'normal';
        RAISE NOTICE '✅ Added priority column to appointments table';
    ELSE
        RAISE NOTICE 'ℹ️ priority column already exists';
    END IF;
END $$;

-- Verify the columns now exist
SELECT 'Verification: Checking all required columns...' as status;

SELECT 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'patient_notes'
    ) THEN '✅ patient_notes exists' 
    ELSE '❌ patient_notes missing' END as patient_notes_status,
    
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'duration_minutes'
    ) THEN '✅ duration_minutes exists' 
    ELSE '❌ duration_minutes missing' END as duration_minutes_status,
    
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'appointment_type'
    ) THEN '✅ appointment_type exists' 
    ELSE '❌ appointment_type missing' END as appointment_type_status,
    
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'priority'
    ) THEN '✅ priority exists' 
    ELSE '❌ priority missing' END as priority_status;

SELECT '🎉 Fix complete! Try booking an appointment now.' as final_status;