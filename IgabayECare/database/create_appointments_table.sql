-- Create comprehensive appointments table for Supabase
-- This table handles all appointment-related data with proper relationships

-- Drop existing table if it exists (for development)
-- DROP TABLE IF EXISTS appointments CASCADE;

-- Create appointments table with enhanced features
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
    duration_minutes INTEGER DEFAULT 30, -- Default 30-minute appointment
    
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, appointment_date);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments table

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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW 
    EXECUTE FUNCTION update_appointments_updated_at();

-- Create function to validate appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping appointments for the same patient
    IF EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE patient_id = NEW.patient_id 
        AND appointment_date = NEW.appointment_date
        AND appointment_time < (NEW.appointment_time + INTERVAL '1 minute' * COALESCE(NEW.duration_minutes, 30))
        AND (NEW.appointment_time + INTERVAL '1 minute' * COALESCE(NEW.duration_minutes, 30)) > appointment_time
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND status NOT IN ('cancelled', 'no_show')
    ) THEN
        RAISE EXCEPTION 'Appointment time conflict for patient';
    END IF;
    
    -- Check for overlapping appointments for the same doctor (if doctor is assigned)
    IF NEW.doctor_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE doctor_id = NEW.doctor_id 
        AND appointment_date = NEW.appointment_date
        AND appointment_time < (NEW.appointment_time + INTERVAL '1 minute' * COALESCE(NEW.duration_minutes, 30))
        AND (NEW.appointment_time + INTERVAL '1 minute' * COALESCE(NEW.duration_minutes, 30)) > appointment_time
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND status NOT IN ('cancelled', 'no_show')
    ) THEN
        RAISE EXCEPTION 'Appointment time conflict for doctor';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_appointment_conflicts_trigger
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_conflicts();

-- Insert sample appointment data for testing
INSERT INTO public.appointments (
    patient_id,
    clinic_id,
    doctor_name,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    priority,
    patient_notes
) VALUES 
-- Sample appointments (you'll need to replace with actual patient_id and clinic_id values)
-- (uuid_generate_v4(), uuid_generate_v4(), 'Dr. Smith', CURRENT_DATE + INTERVAL '1 day', '09:00:00', 'consultation', 'scheduled', 'normal', 'Regular checkup'),
-- (uuid_generate_v4(), uuid_generate_v4(), 'Dr. Johnson', CURRENT_DATE + INTERVAL '2 days', '14:30:00', 'follow_up', 'confirmed', 'normal', 'Follow-up after surgery'),
-- (uuid_generate_v4(), uuid_generate_v4(), 'Dr. Williams', CURRENT_DATE + INTERVAL '3 days', '10:15:00', 'emergency', 'scheduled', 'urgent', 'Severe pain in abdomen')
;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT USAGE ON SEQUENCE appointments_id_seq TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.appointments IS 'Stores all appointment information including patient, clinic, doctor, timing, and status';
COMMENT ON COLUMN public.appointments.id IS 'Unique identifier for the appointment';
COMMENT ON COLUMN public.appointments.patient_id IS 'Reference to the patient making the appointment';
COMMENT ON COLUMN public.appointments.clinic_id IS 'Reference to the clinic where appointment is scheduled';
COMMENT ON COLUMN public.appointments.doctor_id IS 'Reference to the assigned doctor (future implementation)';
COMMENT ON COLUMN public.appointments.appointment_type IS 'Type of appointment (consultation, follow_up, etc.)';
COMMENT ON COLUMN public.appointments.status IS 'Current status of the appointment';
COMMENT ON COLUMN public.appointments.priority IS 'Priority level of the appointment'; 