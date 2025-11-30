-- Enhanced Booking Workflow Schema for MediClinic
-- Supports complete end-to-end booking: Patient → Clinic → Doctor → Completion → Rating

-- Enhanced appointments table with comprehensive workflow tracking
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    
    -- Basic appointment info
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'consultation',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN (
            'pending',           -- Patient booked, waiting clinic assignment
            'assigned',          -- Clinic assigned to doctor
            'confirmed',         -- Doctor confirmed appointment
            'declined',          -- Doctor declined appointment
            'in_progress',       -- Appointment currently happening
            'completed',         -- Appointment finished, waiting prescription
            'prescribed',        -- Prescription submitted
            'cancelled',         -- Cancelled by any party
            'no_show'           -- Patient didn't show up
        )),
    
    -- Patient information
    patient_name VARCHAR(255),
    patient_email VARCHAR(255),
    patient_phone VARCHAR(50),
    patient_notes TEXT,
    requested_services TEXT[], -- Array of requested services
    
    -- Clinic processing
    clinic_notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES clinics(id),
    
    -- Doctor actions
    doctor_notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Prescription link
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    
    -- Rating and feedback
    clinic_rating INTEGER CHECK (clinic_rating >= 1 AND clinic_rating <= 5),
    doctor_rating INTEGER CHECK (doctor_rating >= 1 AND doctor_rating <= 5),
    feedback TEXT,
    rated_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10,2),
    transaction_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_appointment_datetime CHECK (
        appointment_date >= CURRENT_DATE AND
        appointment_time IS NOT NULL
    )
);

-- Enhanced prescriptions table with complete workflow support
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Prescription details
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL, -- Array of medication objects
    instructions TEXT NOT NULL,
    follow_up_date DATE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),
    
    -- Patient access
    patient_viewed_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication structure for prescriptions JSONB
-- Each medication object should contain:
-- {
--   "name": "Medicine Name",
--   "dosage": "500mg",
--   "frequency": "Twice daily",
--   "duration": "7 days",
--   "quantity": "14 tablets",
--   "instructions": "Take with food"
-- }

-- Clinic doctor assignment tracking
CREATE TABLE IF NOT EXISTS clinic_doctor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_by UUID REFERENCES clinics(id), -- Clinic admin who assigned
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Doctor response
    response_status VARCHAR(50) DEFAULT 'pending'
        CHECK (response_status IN ('pending', 'accepted', 'declined')),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced notifications for workflow tracking
CREATE TABLE IF NOT EXISTS workflow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient information
    user_id UUID NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'clinic', 'doctor')),
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    
    -- Related entity
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    sent_via JSONB DEFAULT '[]', -- Array of delivery methods: ['email', 'sms', 'push']
    delivery_status JSONB DEFAULT '{}', -- Status per delivery method
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Appointment status history for audit trail
CREATE TABLE IF NOT EXISTS appointment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL,
    changed_by_type VARCHAR(50) NOT NULL CHECK (changed_by_type IN ('patient', 'clinic', 'doctor', 'system')),
    
    change_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status ON appointments(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

CREATE INDEX IF NOT EXISTS idx_assignments_appointment ON clinic_doctor_assignments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_clinic_doctor ON clinic_doctor_assignments(clinic_id, doctor_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON workflow_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON workflow_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON workflow_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_appointment ON appointment_status_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON appointment_status_history(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;

-- Appointments RLS policies
CREATE POLICY "Patients can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM patients WHERE id = patient_id));

CREATE POLICY "Clinics can view their appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM clinics WHERE id = clinic_id));

CREATE POLICY "Doctors can view assigned appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "Patients can insert appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id FROM patients WHERE id = patient_id));

CREATE POLICY "Clinics can update appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = (SELECT user_id FROM clinics WHERE id = clinic_id));

CREATE POLICY "Doctors can update assigned appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

-- Prescriptions RLS policies
CREATE POLICY "Patients can view their prescriptions" ON prescriptions
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM patients WHERE id = patient_id));

CREATE POLICY "Doctors can view their prescriptions" ON prescriptions
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "Doctors can insert prescriptions" ON prescriptions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "Doctors can update their prescriptions" ON prescriptions
    FOR UPDATE USING (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

-- Clinic assignments RLS policies
CREATE POLICY "Clinics can manage their assignments" ON clinic_doctor_assignments
    FOR ALL USING (auth.uid()::text = (SELECT user_id FROM clinics WHERE id = clinic_id));

CREATE POLICY "Doctors can view their assignments" ON clinic_doctor_assignments
    FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM doctors WHERE id = doctor_id));

-- Workflow notifications RLS policies
CREATE POLICY "Users can view their notifications" ON workflow_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON workflow_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Status history RLS policies
CREATE POLICY "All authenticated users can view status history" ON appointment_status_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Triggers for timestamp updates and status tracking
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON clinic_doctor_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically track status changes
CREATE OR REPLACE FUNCTION track_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO appointment_status_history (
            appointment_id, 
            old_status, 
            new_status, 
            changed_by, 
            changed_by_type
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            CASE 
                WHEN EXISTS (SELECT 1 FROM patients WHERE user_id = auth.uid()) THEN 'patient'
                WHEN EXISTS (SELECT 1 FROM clinics WHERE user_id = auth.uid()) THEN 'clinic'
                WHEN EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid()) THEN 'doctor'
                ELSE 'system'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER appointment_status_change_tracker 
    AFTER UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION track_appointment_status_change();

-- Function to generate prescription numbers
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.prescription_number = 'RX' || to_char(NOW(), 'YYYYMMDD') || 
                              LPAD(EXTRACT(MICROSECONDS FROM NOW())::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_prescription_number_trigger 
    BEFORE INSERT ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION generate_prescription_number();

-- Views for common queries
CREATE OR REPLACE VIEW appointment_dashboard AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.patient_name,
    p.first_name || ' ' || p.last_name as full_patient_name,
    p.email as patient_email,
    p.phone as patient_phone,
    c.clinic_name,
    d.first_name || ' ' || d.last_name as doctor_name,
    a.appointment_type,
    a.payment_status,
    a.created_at
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN doctors d ON a.doctor_id = d.id;

-- Clinic workflow view
CREATE OR REPLACE VIEW clinic_workflow_view AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.patient_name,
    a.patient_email,
    a.patient_phone,
    a.requested_services,
    a.patient_notes,
    a.clinic_notes,
    a.assigned_at,
    a.assigned_by,
    d.first_name || ' ' || d.last_name as assigned_doctor_name,
    da.response_status,
    da.responded_at,
    a.created_at
FROM appointments a
LEFT JOIN clinic_doctor_assignments da ON a.id = da.appointment_id
LEFT JOIN doctors d ON da.doctor_id = d.id
WHERE a.clinic_id IS NOT NULL;

-- Doctor workflow view
CREATE OR REPLACE VIEW doctor_workflow_view AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.patient_name,
    a.patient_email,
    a.patient_phone,
    a.requested_services,
    a.patient_notes,
    a.clinic_notes,
    c.clinic_name,
    c.phone as clinic_phone,
    da.response_status,
    da.assigned_at,
    a.confirmed_at,
    a.declined_at,
    a.decline_reason,
    a.doctor_notes,
    a.started_at,
    a.completed_at,
    a.prescription_id,
    a.created_at
FROM appointments a
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN clinic_doctor_assignments da ON a.id = da.appointment_id
WHERE a.doctor_id IS NOT NULL;

-- Patient workflow view
CREATE OR REPLACE VIEW patient_workflow_view AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.appointment_type,
    a.requested_services,
    a.patient_notes,
    c.clinic_name,
    c.address,
    c.phone as clinic_phone,
    d.first_name || ' ' || d.last_name as doctor_name,
    a.clinic_notes,
    a.doctor_notes,
    a.prescription_id,
    p.prescription_number,
    p.created_at as prescription_created_at,
    a.clinic_rating,
    a.doctor_rating,
    a.feedback,
    a.payment_status,
    a.payment_amount,
    a.created_at
FROM appointments a
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN prescriptions p ON a.prescription_id = p.id
WHERE a.patient_id IS NOT NULL;

COMMENT ON TABLE appointments IS 'Enhanced appointments table supporting complete booking workflow';
COMMENT ON TABLE prescriptions IS 'Prescriptions with full workflow integration';
COMMENT ON TABLE clinic_doctor_assignments IS 'Tracks clinic-to-doctor appointment assignments';
COMMENT ON TABLE workflow_notifications IS 'Comprehensive notification system for workflow events';
COMMENT ON TABLE appointment_status_history IS 'Audit trail for appointment status changes';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON clinic_doctor_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON workflow_notifications TO authenticated;
GRANT SELECT ON appointment_status_history TO authenticated;

GRANT SELECT ON appointment_dashboard TO authenticated;
GRANT SELECT ON clinic_workflow_view TO authenticated;
GRANT SELECT ON doctor_workflow_view TO authenticated;
GRANT SELECT ON patient_workflow_view TO authenticated;

GRANT USAGE ON ALL SEQUENCES TO authenticated;
