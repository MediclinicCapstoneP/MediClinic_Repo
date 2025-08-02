-- Missing Tables and Improvements for IgabayCare Database

-- 1. MISSING: Email Verifications Table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MISSING: Patient Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    clinic_id UUID REFERENCES public.clinics(id),
    record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'lab_result', 'prescription', 'vaccination', 'surgery', 'imaging', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    lab_results JSONB,
    vital_signs JSONB,
    attachments TEXT[], -- URLs to files
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MISSING: Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    clinic_id UUID REFERENCES public.clinics(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    prescribed_date DATE NOT NULL,
    expiry_date DATE,
    refills_remaining INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MISSING: Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('appointment', 'reminder', 'system', 'medical', 'security')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MISSING: Reviews/Ratings Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id),
    doctor_id UUID REFERENCES public.doctors(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MISSING: Insurance Information Table
CREATE TABLE IF NOT EXISTS public.insurance_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    member_id TEXT,
    coverage_type TEXT CHECK (coverage_type IN ('primary', 'secondary', 'tertiary')),
    effective_date DATE,
    expiry_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MISSING: Payment/Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id),
    appointment_id UUID REFERENCES public.appointments(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'insurance', 'online')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    transaction_id TEXT UNIQUE,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MISSING: Chat/Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    content TEXT NOT NULL,
    attachments TEXT[],
    is_read BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MISSING: Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. MISSING: Settings/Preferences Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "medical_records_visible": false}',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. MISSING: Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. MISSING: Lab Results Table
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    clinic_id UUID REFERENCES public.clinics(id),
    test_name TEXT NOT NULL,
    test_date DATE NOT NULL,
    results JSONB NOT NULL,
    reference_range TEXT,
    units TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'abnormal', 'critical')),
    lab_name TEXT,
    lab_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. MISSING: Vaccination Records Table
CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    clinic_id UUID REFERENCES public.clinics(id),
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT,
    dose_number INTEGER,
    total_doses INTEGER,
    administration_date DATE NOT NULL,
    next_dose_date DATE,
    lot_number TEXT,
    manufacturer TEXT,
    site_of_administration TEXT,
    adverse_reactions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. MISSING: Allergies Table
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen_name TEXT NOT NULL,
    allergy_type TEXT CHECK (allergy_type IN ('medication', 'food', 'environmental', 'other')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    symptoms TEXT,
    onset_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. MISSING: Insurance Claims Table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id),
    appointment_id UUID REFERENCES public.appointments(id),
    insurance_id UUID REFERENCES public.insurance_info(id),
    claim_number TEXT UNIQUE,
    service_date DATE NOT NULL,
    amount_billed DECIMAL(10,2) NOT NULL,
    amount_covered DECIMAL(10,2),
    patient_responsibility DECIMAL(10,2),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'approved', 'denied', 'paid')),
    denial_reason TEXT,
    submitted_date DATE DEFAULT CURRENT_DATE,
    processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. MISSING: Staff/Employees Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('receptionist', 'nurse', 'technician', 'administrator', 'billing', 'other')),
    department TEXT,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. MISSING: Operating Hours Table (Alternative to JSONB)
CREATE TABLE IF NOT EXISTS public.operating_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    break_start TIME,
    break_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, day_of_week)
);

-- 18. MISSING: Waitlist Table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    appointment_type TEXT,
    urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    preferred_date DATE,
    preferred_time TIME,
    notes TEXT,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'scheduled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. MISSING: Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    referring_doctor_id UUID REFERENCES public.doctors(id),
    referred_to_doctor_id UUID REFERENCES public.doctors(id),
    referring_clinic_id UUID REFERENCES public.clinics(id),
    referred_to_clinic_id UUID REFERENCES public.clinics(id),
    reason TEXT NOT NULL,
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
    referral_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. MISSING: Telemedicine Sessions Table
CREATE TABLE IF NOT EXISTS public.telemedicine_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    session_url TEXT,
    session_id TEXT,
    platform TEXT, -- 'zoom', 'teams', 'custom', etc.
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    recording_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id ON reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_insurance_info_patient_id ON insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_patient_id ON vaccination_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_operating_hours_clinic_id ON operating_hours(clinic_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_patient_id ON waitlist(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient_id ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment_id ON telemedicine_sessions(appointment_id);

-- Enable RLS on all tables
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_info_updated_at BEFORE UPDATE ON insurance_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccination_records_updated_at BEFORE UPDATE ON vaccination_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON allergies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operating_hours_updated_at BEFORE UPDATE ON operating_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telemedicine_sessions_updated_at BEFORE UPDATE ON telemedicine_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Success message
SELECT 'Missing tables created successfully!' as status; 