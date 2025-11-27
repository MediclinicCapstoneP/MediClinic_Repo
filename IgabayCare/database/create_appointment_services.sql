-- ===================================================================
-- Create appointment_services table
-- This table links appointments to specific clinic services with pricing
-- ===================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.appointment_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.clinic_services(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_price ON appointment_services(price);

-- Enable Row Level Security
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Patients can view services for their own appointments
CREATE POLICY "Patients can view own appointment services" ON appointment_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.patient_id IN (
                SELECT patients.id FROM patients 
                WHERE patients.user_id = auth.uid()
            )
        )
    );

-- Clinics can view and manage services for their own appointments
CREATE POLICY "Clinics can manage own appointment services" ON appointment_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.clinic_id IN (
                SELECT clinics.id FROM clinics 
                WHERE clinics.user_id = auth.uid()
            )
        )
    );

-- Patients can insert services for their own appointments
CREATE POLICY "Patients can insert own appointment services" ON appointment_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.patient_id IN (
                SELECT patients.id FROM patients 
                WHERE patients.user_id = auth.uid()
            )
        )
    );

-- Trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_appointment_services_updated_at
    BEFORE UPDATE ON appointment_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON appointment_services TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE appointment_services_id_seq TO authenticated;

-- Comments
COMMENT ON TABLE appointment_services IS 'Links appointments to specific clinic services with quantities and pricing';
COMMENT ON COLUMN appointment_services.appointment_id IS 'Foreign key to appointments table';
COMMENT ON COLUMN appointment_services.service_id IS 'Foreign key to clinic_services table';
COMMENT ON COLUMN appointment_services.quantity IS 'Number of service units booked';
COMMENT ON COLUMN appointment_services.price IS 'Unit price of the service at time of booking';
COMMENT ON COLUMN appointment_services.total_price IS 'Total cost for the service (price * quantity)';

-- ===================================================================
-- To run this: Execute in Supabase SQL Editor or via psql
-- Note: Ensure clinic_services table exists before running
-- ===================================================================