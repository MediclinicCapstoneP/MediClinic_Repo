-- ===================================================================
-- CREATE APPOINTMENT HISTORY TABLE
-- ===================================================================
-- This script creates the appointment_history table to track completed appointments
-- and provides a comprehensive history for patients

-- Create appointment_history table
CREATE TABLE IF NOT EXISTS public.appointment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID, -- Future reference to doctors table
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Appointment details (copied from original appointment)
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    
    -- Medical details
    consultation_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_given BOOLEAN DEFAULT FALSE,
    
    -- Follow-up information
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Provider information (denormalized for historical accuracy)
    doctor_name TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    
    -- Payment information
    payment_amount DECIMAL(10,2),
    payment_status TEXT,
    
    -- Timestamps
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointment_history_patient_id ON public.appointment_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON public.appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_clinic_id ON public.appointment_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_doctor_id ON public.appointment_history(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_date ON public.appointment_history(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_history_completed_at ON public.appointment_history(completed_at);

-- Enable Row Level Security
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_history table
CREATE POLICY "Patients can view their own appointment history" ON public.appointment_history
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.patients WHERE id = appointment_history.patient_id
        )
    );

CREATE POLICY "Doctors can view appointment history for their patients" ON public.appointment_history
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.doctors WHERE id = appointment_history.doctor_id
        )
    );

CREATE POLICY "Clinics can view appointment history for their appointments" ON public.appointment_history
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.clinics WHERE id = appointment_history.clinic_id
        )
    );

CREATE POLICY "System can insert appointment history" ON public.appointment_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update appointment history" ON public.appointment_history
    FOR UPDATE USING (true);

-- Create a function to automatically create appointment history when appointment is completed
CREATE OR REPLACE FUNCTION public.create_appointment_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO public.appointment_history (
            appointment_id,
            patient_id,
            doctor_id,
            clinic_id,
            appointment_date,
            appointment_time,
            appointment_type,
            status,
            consultation_notes,
            prescription_given,
            doctor_name,
            clinic_name,
            payment_amount,
            payment_status,
            completed_at
        )
        SELECT 
            NEW.id,
            NEW.patient_id,
            NEW.doctor_id,
            NEW.clinic_id,
            NEW.appointment_date,
            NEW.appointment_time,
            NEW.appointment_type,
            NEW.status,
            NEW.doctor_notes,
            COALESCE(NEW.prescription_given, FALSE),
            COALESCE(
                (SELECT CONCAT('Dr. ', first_name, ' ', last_name) 
                 FROM public.doctors WHERE id = NEW.doctor_id),
                'Unknown Doctor'
            ),
            COALESCE(
                (SELECT clinic_name FROM public.clinics WHERE id = NEW.clinic_id),
                'Unknown Clinic'
            ),
            NEW.payment_amount,
            NEW.payment_status,
            COALESCE(NEW.completed_at, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create appointment history
DROP TRIGGER IF EXISTS trigger_create_appointment_history ON public.appointments;
CREATE TRIGGER trigger_create_appointment_history
    AFTER UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.create_appointment_history();

-- Create a view for easy appointment history access with related data
CREATE OR REPLACE VIEW public.appointment_history_view AS
SELECT 
    ah.*,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.email as patient_email,
    c.address as clinic_address,
    c.phone as clinic_phone,
    CASE 
        WHEN ah.prescription_given THEN 
            (SELECT COUNT(*) FROM public.prescriptions WHERE appointment_id = ah.appointment_id)
        ELSE 0
    END as prescription_count
FROM public.appointment_history ah
LEFT JOIN public.patients p ON ah.patient_id = p.id
LEFT JOIN public.clinics c ON ah.clinic_id = c.id;

-- Grant necessary permissions
GRANT SELECT ON public.appointment_history TO authenticated;
GRANT SELECT ON public.appointment_history_view TO authenticated;
GRANT INSERT ON public.appointment_history TO service_role;
GRANT UPDATE ON public.appointment_history TO service_role;

RAISE NOTICE 'Appointment history table and related objects created successfully';
