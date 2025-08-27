-- Fix appointments table schema - ensure all required columns exist
-- Run this in your Supabase SQL Editor to fix the duration_minutes column issue

-- Step 1: Check if appointments table exists
SELECT 'Checking appointments table existence...' as status;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments'
) as table_exists;

-- Step 2: Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Patient and Clinic relationships
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Doctor information (can be null if not assigned yet)
    doctor_id UUID, -- Future reference to doctors table
    doctor_name TEXT,
    doctor_specialty TEXT,
    
    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30, -- This is the missing column!
    
    -- Appointment type and category
    appointment_type TEXT NOT NULL DEFAULT 'consultation' CHECK (
        appointment_type IN (
            'consultation', 
            'follow_up', 
            'emergency', 
            'routine_checkup', 
            'specialist_visit', 
            'procedure', 
            'surgery', 
            'lab_test', 
            'imaging', 
            'vaccination',
            'physical_therapy',
            'mental_health',
            'dental',
            'vision',
            'other'
        )
    ),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
        status IN (
            'scheduled', 
            'confirmed', 
            'in_progress', 
            'completed', 
            'cancelled', 
            'no_show', 
            'rescheduled'
        )
    ),
    
    -- Priority and urgency
    priority TEXT DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    
    -- Location and room information
    room_number TEXT,
    floor_number TEXT,
    building TEXT,
    
    -- Notes and additional information
    patient_notes TEXT, -- Notes from patient
    doctor_notes TEXT, -- Notes from doctor
    admin_notes TEXT, -- Internal notes
    
    -- Insurance and billing
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    copay_amount DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Reminders and notifications
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID, -- user_id of who cancelled
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_appointment_time CHECK (
        appointment_time >= '08:00:00' AND appointment_time <= '18:00:00'
    ),
    CONSTRAINT valid_appointment_date CHECK (
        appointment_date >= CURRENT_DATE
    )
);

-- Step 3: Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add duration_minutes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN duration_minutes INTEGER DEFAULT 30;
        RAISE NOTICE 'Added duration_minutes column to appointments table';
    ELSE
        RAISE NOTICE 'duration_minutes column already exists';
    END IF;
    
    -- Add patient_notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'patient_notes'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN patient_notes TEXT;
        RAISE NOTICE 'Added patient_notes column to appointments table';
    ELSE
        RAISE NOTICE 'patient_notes column already exists';
    END IF;
    
    -- Add appointment_type column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'appointment_type'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_type TEXT DEFAULT 'consultation';
        RAISE NOTICE 'Added appointment_type column to appointments table';
    ELSE
        RAISE NOTICE 'appointment_type column already exists';
    END IF;
    
    -- Add priority column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN priority TEXT DEFAULT 'normal';
        RAISE NOTICE 'Added priority column to appointments table';
    ELSE
        RAISE NOTICE 'priority column already exists';
    END IF;
END $$;

-- Step 4: Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, appointment_date);

-- Step 5: Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can view appointments for their clinic" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can update appointments for their clinic" ON public.appointments;
DROP POLICY IF EXISTS "Patients can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can delete appointments for their clinic" ON public.appointments;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- Clinics can view appointments for their clinic
CREATE POLICY "Clinics can view appointments for their clinic" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Patients can create appointments for themselves
CREATE POLICY "Patients can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- Clinics can create appointments for their clinic
CREATE POLICY "Clinics can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Patients can update their own appointments (limited fields)
CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- Clinics can update appointments for their clinic
CREATE POLICY "Clinics can update appointments for their clinic" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Patients can delete their own appointments (if not confirmed/completed)
CREATE POLICY "Patients can delete own appointments" ON public.appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
        AND status IN ('scheduled', 'cancelled')
    );

-- Clinics can delete appointments for their clinic
CREATE POLICY "Clinics can delete appointments for their clinic" ON public.appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Step 7: Verify the table structure
SELECT 'Verification: Checking appointments table structure...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Step 8: Test appointment creation capability
SELECT 'Setup complete! Your appointments table is ready for booking.' as final_status;

-- Step 9: Grant necessary permissions
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO anon;

SELECT 'Permissions granted. Appointment booking should now work!' as result;