-- ===================================================================
-- COMPLETE APPOINTMENT BOOKING + FOLLOW-UP + NOTIFICATIONS + PAYMENT FLOW
-- ===================================================================
-- This script creates the missing tables and enhances existing ones for the complete flow

-- ===================================================================
-- 1. ENHANCE APPOINTMENTS TABLE WITH PAYMENT AND FOLLOW-UP SUPPORT
-- ===================================================================

-- Add missing columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- ===================================================================
-- 2. CREATE TRANSACTIONS TABLE (Enhanced from payment_system_setup.sql)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction details
    transaction_number TEXT UNIQUE NOT NULL DEFAULT ('TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
    
    -- Amount breakdown
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    booking_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('gcash', 'paymaya', 'credit_card', 'debit_card', 'bank_transfer', 'cash')),
    payment_provider TEXT, -- PayMongo, GCash, etc.
    external_payment_id TEXT, -- Payment gateway transaction ID
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Payment timestamps
    payment_date TIMESTAMP WITH TIME ZONE,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    payment_proof_url TEXT,
    failure_reason TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. ENHANCE NOTIFICATIONS TABLE
-- ===================================================================

-- Add missing columns to notifications table if they don't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'general' CHECK (notification_type IN (
    'appointment_booked', 'appointment_confirmed', 'appointment_reminder', 
    'appointment_completed', 'follow_up_scheduled', 'payment_confirmed', 
    'payment_failed', 'appointment_cancelled', 'general'
)),
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT FALSE;

-- ===================================================================
-- 4. CREATE FOLLOW-UP APPOINTMENTS TABLE
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.follow_up_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    original_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    follow_up_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID, -- Future reference to doctors table
    
    -- Follow-up details
    follow_up_type TEXT DEFAULT 'routine' CHECK (follow_up_type IN ('routine', 'urgent', 'check_results', 'medication_review', 'progress_check')),
    recommended_date DATE,
    scheduled_date DATE,
    
    -- Pricing logic
    is_free BOOLEAN DEFAULT FALSE, -- Free if within 7 days
    discount_percentage DECIMAL(5,2) DEFAULT 0.00, -- Discount if within 30 days
    original_fee DECIMAL(10,2),
    discounted_fee DECIMAL(10,2),
    
    -- Status
    status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'scheduled', 'completed', 'cancelled', 'expired')),
    
    -- Notes
    doctor_notes TEXT,
    reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 5. CREATE APPOINTMENT REMINDERS TABLE
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Reminder configuration
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hours', '2_hours', '30_minutes', 'custom')),
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Delivery methods
    send_email BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_push BOOLEAN DEFAULT TRUE,
    
    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Message content
    subject TEXT,
    message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number ON transactions(transaction_number);

-- Enhanced notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

-- Follow-up appointments indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_original_appointment ON follow_up_appointments(original_appointment_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_patient_id ON follow_up_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_clinic_id ON follow_up_appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON follow_up_appointments(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_recommended_date ON follow_up_appointments(recommended_date);

-- Appointment reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON appointment_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON appointment_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON appointment_reminders(status);

-- ===================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ===================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 8. CREATE RLS POLICIES
-- ===================================================================

-- Transactions policies
DROP POLICY IF EXISTS "Patients can view their own transactions" ON transactions;
CREATE POLICY "Patients can view their own transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = transactions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can view transactions for their clinic" ON transactions;
CREATE POLICY "Clinics can view transactions for their clinic" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = transactions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can create and update transactions" ON transactions;
CREATE POLICY "System can create and update transactions" ON transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Follow-up appointments policies
DROP POLICY IF EXISTS "Patients can view their follow-ups" ON follow_up_appointments;
CREATE POLICY "Patients can view their follow-ups" ON follow_up_appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = follow_up_appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can manage follow-ups for their patients" ON follow_up_appointments;
CREATE POLICY "Clinics can manage follow-ups for their patients" ON follow_up_appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = follow_up_appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Appointment reminders policies
DROP POLICY IF EXISTS "Patients can view their reminders" ON appointment_reminders;
CREATE POLICY "Patients can view their reminders" ON appointment_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointment_reminders.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage reminders" ON appointment_reminders;
CREATE POLICY "System can manage reminders" ON appointment_reminders
    FOR ALL USING (true) WITH CHECK (true);

-- ===================================================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================================================

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_appointments_updated_at 
    BEFORE UPDATE ON follow_up_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_reminders_updated_at 
    BEFORE UPDATE ON appointment_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 10. CREATE FUNCTIONS FOR FOLLOW-UP PRICING
-- ===================================================================

CREATE OR REPLACE FUNCTION calculate_follow_up_fee(
    original_appointment_date DATE,
    follow_up_date DATE,
    original_fee DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    days_difference INTEGER;
    calculated_fee DECIMAL(10,2);
BEGIN
    days_difference := follow_up_date - original_appointment_date;
    
    IF days_difference <= 7 THEN
        -- Free within 7 days
        calculated_fee := 0.00;
    ELSIF days_difference <= 30 THEN
        -- 50% discount within 30 days
        calculated_fee := original_fee * 0.5;
    ELSE
        -- Full price after 30 days
        calculated_fee := original_fee;
    END IF;
    
    RETURN calculated_fee;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 11. CREATE FUNCTION TO AUTO-CREATE REMINDERS
-- ===================================================================

CREATE OR REPLACE FUNCTION create_appointment_reminders(
    appointment_id_param UUID,
    patient_id_param UUID,
    appointment_datetime TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
    -- 24 hours reminder
    INSERT INTO appointment_reminders (
        appointment_id, patient_id, reminder_type, reminder_time,
        subject, message
    ) VALUES (
        appointment_id_param, patient_id_param, '24_hours',
        appointment_datetime - INTERVAL '24 hours',
        'Appointment Reminder - Tomorrow',
        'This is a reminder that you have an appointment tomorrow. Please arrive 15 minutes early.'
    );
    
    -- 2 hours reminder
    INSERT INTO appointment_reminders (
        appointment_id, patient_id, reminder_type, reminder_time,
        subject, message
    ) VALUES (
        appointment_id_param, patient_id_param, '2_hours',
        appointment_datetime - INTERVAL '2 hours',
        'Appointment Reminder - In 2 Hours',
        'Your appointment is in 2 hours. Please prepare any necessary documents and arrive on time.'
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 12. GRANT PERMISSIONS
-- ===================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON follow_up_appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointment_reminders TO authenticated;

-- ===================================================================
-- 13. VERIFICATION
-- ===================================================================

SELECT '✅ Complete appointment flow schema setup completed!' as status;
