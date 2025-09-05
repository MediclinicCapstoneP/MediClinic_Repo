-- ===================================================================
-- IGABAYATICARE ENHANCED DATABASE SCHEMA
-- ===================================================================
-- Comprehensive schema supporting ML validation, payment-first booking,
-- AI chatbot, mobile optimization, and enhanced security features

-- ===================================================================
-- 1. EXTENSIONS AND FUNCTIONS
-- ===================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================================
-- 2. ENHANCED USER AUTHENTICATION & PROFILES
-- ===================================================================

-- Enhanced patients table with comprehensive medical information
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Address Information
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Philippines',
    
    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    
    -- Medical Information
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[],
    medical_notes TEXT,
    
    -- Insurance Information
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry DATE,
    
    -- Profile & Verification
    profile_pic_url TEXT,
    id_document_url TEXT,
    id_document_type TEXT CHECK (id_document_type IN ('national_id', 'passport', 'drivers_license')),
    id_verified BOOLEAN DEFAULT FALSE,
    
    -- Account Status
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'partial', 'verified')),
    
    -- ML Validation
    ml_risk_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    ml_last_validated TIMESTAMP WITH TIME ZONE,
    suspicious_activity_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enhanced clinics table with comprehensive business information
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Information
    clinic_name TEXT NOT NULL,
    business_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    
    -- Address & Location
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    country TEXT DEFAULT 'Philippines',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Business Details
    business_registration_number TEXT,
    tax_id TEXT,
    license_number TEXT NOT NULL,
    license_expiry DATE,
    accreditation TEXT[],
    year_established INTEGER,
    
    -- Services & Specialties
    specialties TEXT[] DEFAULT '{}',
    custom_specialties TEXT[] DEFAULT '{}',
    services TEXT[] DEFAULT '{}',
    custom_services TEXT[] DEFAULT '{}',
    
    -- Operating Information
    operating_hours JSONB,
    number_of_doctors INTEGER DEFAULT 0,
    number_of_staff INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 50,
    
    -- Description & Media
    description TEXT,
    profile_pic_url TEXT,
    clinic_images TEXT[],
    
    -- Documents
    license_document_url TEXT,
    business_permit_url TEXT,
    tax_document_url TEXT,
    accreditation_documents TEXT[],
    
    -- Verification & Status
    document_verification_status TEXT DEFAULT 'pending' CHECK (document_verification_status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    
    -- ML Validation
    ml_legitimacy_score DECIMAL(3,2) DEFAULT 0.0,
    ml_last_validated TIMESTAMP WITH TIME ZONE,
    fraud_risk_level TEXT DEFAULT 'low' CHECK (fraud_risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Business Metrics
    total_appointments INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id),
    UNIQUE(license_number)
);

-- Doctors table (can be associated with clinics or independent)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Professional Information
    medical_license_number TEXT NOT NULL,
    specialization TEXT[] DEFAULT '{}',
    sub_specialization TEXT[],
    years_of_experience INTEGER,
    education TEXT[],
    certifications TEXT[],
    
    -- Practice Information
    consultation_fee DECIMAL(10,2),
    currency TEXT DEFAULT 'PHP',
    consultation_duration INTEGER DEFAULT 30, -- minutes
    
    -- Schedule & Availability
    working_hours JSONB,
    available_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
    
    -- Profile & Documents
    profile_pic_url TEXT,
    cv_document_url TEXT,
    license_document_url TEXT,
    certification_documents TEXT[],
    
    -- Verification
    license_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Performance Metrics
    total_consultations INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(medical_license_number)
);

-- ===================================================================
-- 3. PAYMENT SYSTEM (ADYEN INTEGRATION)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Payment Identifiers
    adyen_payment_id TEXT,
    adyen_psp_reference TEXT,
    merchant_reference TEXT NOT NULL,
    
    -- User & Appointment
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID, -- Will reference appointments table
    
    -- Payment Details
    amount_value INTEGER NOT NULL, -- Amount in minor units (cents)
    currency TEXT NOT NULL DEFAULT 'PHP',
    payment_method TEXT, -- gcash, paymaya, card, etc.
    payment_method_brand TEXT, -- visa, mastercard, etc.
    
    -- Payment Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'authorized', 'settled', 'cancelled', 
        'refused', 'error', 'refunded', 'partially_refunded'
    )),
    
    -- Adyen Response Data
    adyen_result_code TEXT,
    adyen_response JSONB,
    
    -- Refund Information
    refund_amount INTEGER DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(merchant_reference)
);

-- ===================================================================
-- 4. ENHANCED APPOINTMENTS SYSTEM
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Relationships
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    timezone TEXT DEFAULT 'Asia/Manila',
    
    -- Appointment Type & Category
    appointment_type TEXT NOT NULL DEFAULT 'consultation' CHECK (
        appointment_type IN (
            'consultation', 'follow_up', 'emergency', 'routine_checkup', 
            'specialist_visit', 'procedure', 'surgery', 'lab_test', 
            'imaging', 'vaccination', 'physical_therapy', 'mental_health',
            'dental', 'vision', 'telemedicine', 'other'
        )
    ),
    
    -- Status & Priority
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_payment', 'payment_confirmed', 'scheduled', 'confirmed', 
            'checked_in', 'in_progress', 'completed', 'cancelled', 
            'no_show', 'rescheduled', 'refunded'
        )
    ),
    
    priority TEXT DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent', 'emergency')
    ),
    
    -- Payment Information
    consultation_fee DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
    ),
    payment_method TEXT,
    
    -- Location Information
    room_number TEXT,
    floor_number TEXT,
    building TEXT,
    is_telemedicine BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    
    -- Notes & Information
    patient_notes TEXT,
    symptoms TEXT,
    doctor_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription TEXT,
    admin_notes TEXT,
    
    -- Notifications & Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation & Rescheduling
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID,
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES public.appointments(id),
    rescheduled_to UUID REFERENCES public.appointments(id),
    
    -- ML Validation
    booking_legitimacy_score DECIMAL(3,2) DEFAULT 1.0,
    ml_validation_status TEXT DEFAULT 'pending' CHECK (
        ml_validation_status IN ('pending', 'approved', 'flagged', 'rejected')
    ),
    ml_flags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_appointment_time CHECK (
        appointment_time >= '06:00:00' AND appointment_time <= '22:00:00'
    ),
    CONSTRAINT valid_appointment_date CHECK (
        appointment_date >= CURRENT_DATE - INTERVAL '1 day'
    ),
    CONSTRAINT valid_consultation_fee CHECK (consultation_fee >= 0)
);

-- ===================================================================
-- 5. MEDICAL RECORDS & HISTORY
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Relationships
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    -- Medical Information
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    symptoms TEXT[],
    vital_signs JSONB, -- blood_pressure, temperature, heart_rate, etc.
    physical_examination TEXT,
    diagnosis TEXT[] NOT NULL,
    treatment_plan TEXT,
    recommendations TEXT,
    
    -- Prescriptions
    medications JSONB, -- array of medication objects
    dosage_instructions TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    
    -- Documents
    lab_results TEXT[],
    imaging_results TEXT[],
    other_documents TEXT[],
    
    -- Access Control
    visible_to_patient BOOLEAN DEFAULT TRUE,
    shared_with_providers UUID[], -- Array of clinic/doctor IDs
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 6. MACHINE LEARNING VALIDATION SYSTEM
-- ===================================================================

-- ML Models and Validation Rules
CREATE TABLE IF NOT EXISTS public.ml_validation_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('booking_validation', 'clinic_verification', 'fraud_detection')),
    model_version TEXT NOT NULL,
    
    -- Model Configuration
    model_config JSONB NOT NULL,
    feature_weights JSONB,
    threshold_scores JSONB,
    
    -- Model Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    accuracy_score DECIMAL(5,4),
    last_trained TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_name, model_version)
);

-- Validation Results and Logs
CREATE TABLE IF NOT EXISTS public.ml_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Validation Context
    model_id UUID REFERENCES public.ml_validation_models(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('patient', 'clinic', 'appointment', 'doctor')),
    entity_id UUID NOT NULL,
    
    -- Validation Results
    validation_score DECIMAL(5,4) NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    flags TEXT[],
    
    -- Input Features
    input_features JSONB NOT NULL,
    
    -- Model Response
    model_response JSONB,
    confidence_score DECIMAL(5,4),
    
    -- Action Taken
    action_taken TEXT CHECK (action_taken IN ('approved', 'flagged', 'rejected', 'manual_review')),
    reviewed_by UUID,
    reviewer_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 7. AI CHATBOT SYSTEM
-- ===================================================================

-- Chatbot Conversations
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User Information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('patient', 'clinic', 'doctor', 'anonymous')),
    session_id TEXT NOT NULL,
    
    -- Conversation Context
    conversation_type TEXT CHECK (conversation_type IN (
        'booking_assistance', 'clinic_search', 'account_help', 
        'technical_support', 'general_inquiry', 'emergency'
    )),
    
    -- Conversation Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'escalated')),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Chatbot Messages
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
    
    -- Message Details
    message_text TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
    
    -- AI Response Details (for bot messages)
    openai_model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Context & Intent
    user_intent TEXT,
    entities_extracted JSONB,
    confidence_score DECIMAL(3,2),
    
    -- Actions & Results
    actions_triggered TEXT[],
    booking_context JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 8. NOTIFICATION SYSTEM
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Recipient Information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'clinic', 'doctor')),
    
    -- Notification Details
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'appointment_confirmed', 'appointment_reminder', 'appointment_cancelled',
        'payment_received', 'payment_failed', 'refund_processed',
        'clinic_approved', 'clinic_rejected', 'document_required',
        'system_update', 'security_alert', 'promotional'
    )),
    
    -- Priority & Delivery
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    delivery_method TEXT[] DEFAULT '{"push"}' CHECK (
        delivery_method <@ '{"push", "email", "sms", "in_app"}'
    ),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Related Entities
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    
    -- Push Notification Details
    push_token TEXT,
    push_response JSONB,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 9. SYSTEM CONFIGURATION & SETTINGS
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('config', 'feature_flag', 'ml_parameter', 'business_rule')),
    
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ===================================================================

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_user_id ON public.clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);

-- Appointment search indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_adyen_reference ON public.payments(adyen_psp_reference);

-- Geospatial index for clinic location search
CREATE INDEX IF NOT EXISTS idx_clinics_location ON public.clinics USING GIST (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ML validation indexes
CREATE INDEX IF NOT EXISTS idx_ml_logs_entity ON public.ml_validation_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ml_logs_created ON public.ml_validation_logs(created_at);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ===================================================================
-- 11. TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Update timestamps automatically
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 12. ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY "Patients can view their own profile" ON public.patients
    FOR ALL USING (auth.uid() = user_id);

-- Clinics can only see their own data and their appointments
CREATE POLICY "Clinics can view their own profile" ON public.clinics
    FOR ALL USING (auth.uid() = user_id);

-- Appointment access policies
CREATE POLICY "Patients can view their appointments" ON public.appointments
    FOR SELECT USING (
        patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Clinics can view their appointments" ON public.appointments
    FOR ALL USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

-- Payment access policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
        OR
        clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    );

-- Insert sample system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('ml_booking_validation_threshold', '0.7', 'ml_parameter', 'Minimum score for automatic booking approval'),
('ml_clinic_verification_threshold', '0.8', 'ml_parameter', 'Minimum score for automatic clinic verification'),
('payment_timeout_minutes', '15', 'business_rule', 'Payment timeout in minutes'),
('appointment_reminder_hours', '24', 'business_rule', 'Hours before appointment to send reminder'),
('max_daily_bookings_per_patient', '5', 'business_rule', 'Maximum daily bookings per patient');
