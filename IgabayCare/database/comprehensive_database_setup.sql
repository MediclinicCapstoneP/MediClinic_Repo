-- ===================================================================
-- COMPREHENSIVE DATABASE SETUP FOR MEDICLINIC
-- ===================================================================
-- This script sets up all required tables and relationships for the MediClinic application
-- Run this script in your Supabase SQL Editor to create the complete database schema

-- ===================================================================
-- 1. ENSURE REQUIRED EXTENSIONS
-- ===================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- 2. CREATE PATIENTS TABLE (if not exists)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ===================================================================
-- 3. CREATE CLINICS TABLE (if not exists) 
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clinic_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    license_number TEXT,
    accreditation TEXT,
    tax_id TEXT,
    year_established INTEGER,
    specialties TEXT[] DEFAULT '{}',
    custom_specialties TEXT[] DEFAULT '{}',
    services TEXT[] DEFAULT '{}',
    custom_services TEXT[] DEFAULT '{}',
    operating_hours JSONB,
    number_of_doctors INTEGER DEFAULT 0,
    number_of_staff INTEGER DEFAULT 0,
    description TEXT,
    profile_pic_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add latitude and longitude columns to existing clinics table if they don't exist
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- ===================================================================
-- 4. CREATE APPOINTMENTS TABLE
-- ===================================================================
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

-- ===================================================================
-- 5. CREATE CLINIC SERVICES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.clinic_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Service details
    service_name TEXT NOT NULL,
    service_category TEXT CHECK (service_category IN (
        'consultation', 'routine_checkup', 'follow_up', 'emergency', 
        'specialist_visit', 'vaccination', 'procedure', 'surgery', 
        'lab_test', 'imaging', 'physical_therapy', 'mental_health', 
        'dental', 'vision', 'other'
    )),
    description TEXT,
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency TEXT DEFAULT 'PHP',
    
    -- Service availability
    is_available BOOLEAN DEFAULT true,
    duration_minutes INTEGER, -- Expected duration of service
    
    -- Additional pricing options
    has_insurance_coverage BOOLEAN DEFAULT false,
    insurance_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    senior_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    student_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Service requirements
    requires_appointment BOOLEAN DEFAULT true,
    requires_referral BOOLEAN DEFAULT false,
    min_age INTEGER,
    max_age INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique service names per clinic
    UNIQUE(clinic_id, service_name)
);

-- ===================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

-- Clinic indexes
CREATE INDEX IF NOT EXISTS idx_clinics_user_id ON clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_clinics_specialties ON clinics USING GIN(specialties);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);

-- Clinic services indexes
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id ON clinic_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_services_category ON clinic_services(service_category);
CREATE INDEX IF NOT EXISTS idx_clinic_services_price ON clinic_services(base_price);
CREATE INDEX IF NOT EXISTS idx_clinic_services_available ON clinic_services(is_available);

-- ===================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 8. CREATE RLS POLICIES
-- ===================================================================

-- Patient policies
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
CREATE POLICY "Patients can view own profile" ON patients
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
CREATE POLICY "Patients can update own profile" ON patients
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Patients can insert own profile" ON patients;
CREATE POLICY "Patients can insert own profile" ON patients
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Clinic policies
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
CREATE POLICY "Clinics can view own profile" ON clinics
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view approved clinics" ON clinics;
CREATE POLICY "Public can view approved clinics" ON clinics
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
CREATE POLICY "Clinics can update own profile" ON clinics
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;
CREATE POLICY "Clinics can insert own profile" ON clinics
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Appointment policies
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can view appointments for their clinic" ON appointments;
CREATE POLICY "Clinics can view appointments for their clinic" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Patients can update own appointments" ON appointments;
CREATE POLICY "Patients can update own appointments" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can update appointments for their clinic" ON appointments;
CREATE POLICY "Clinics can update appointments for their clinic" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = appointments.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Clinic services policies
DROP POLICY IF EXISTS "Clinics can manage their own services" ON clinic_services;
CREATE POLICY "Clinics can manage their own services" ON clinic_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = clinic_services.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can view available clinic services" ON clinic_services;
CREATE POLICY "Public can view available clinic services" ON clinic_services
    FOR SELECT USING (is_available = true);

-- ===================================================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at 
    BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinic_services_updated_at ON clinic_services;
CREATE TRIGGER update_clinic_services_updated_at 
    BEFORE UPDATE ON clinic_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 10. CREATE NOTIFICATIONS TABLE
-- ===================================================================
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'clinic', 'doctor')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing notifications table if they don't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('patient', 'clinic', 'doctor'));

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create trigger for notifications updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default services for existing approved clinics (only if clinics exist)
DO $$
BEGIN
    -- Only insert services if there are approved clinics
    IF EXISTS (SELECT 1 FROM clinics WHERE status = 'approved') THEN
        INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
        SELECT 
            c.id as clinic_id,
            'General Consultation' as service_name,
            'consultation' as service_category,
            500.00 as base_price,
            'Standard medical consultation with licensed physician' as description,
            30 as duration_minutes
        FROM clinics c 
        WHERE c.status = 'approved'
        ON CONFLICT (clinic_id, service_name) DO NOTHING;

        INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
        SELECT 
            c.id as clinic_id,
            'Routine Checkup' as service_name,
            'routine_checkup' as service_category,
            400.00 as base_price,
            'Comprehensive health screening and physical examination' as description,
            45 as duration_minutes
        FROM clinics c 
        WHERE c.status = 'approved'
        ON CONFLICT (clinic_id, service_name) DO NOTHING;

        INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
        SELECT 
            c.id as clinic_id,
            'Follow-up Visit' as service_name,
            'follow_up' as service_category,
            300.00 as base_price,
            'Follow-up consultation for ongoing treatment' as description,
            20 as duration_minutes
        FROM clinics c 
        WHERE c.status = 'approved'
        ON CONFLICT (clinic_id, service_name) DO NOTHING;
    END IF;
END $$;

-- ===================================================================
-- 11. GRANT PERMISSIONS
-- ===================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_services TO authenticated;

-- Grant select on approved clinics to anonymous users (for public browsing)
GRANT SELECT ON clinics TO anon;
GRANT SELECT ON clinic_services TO anon;

-- ===================================================================
-- 12. VERIFICATION QUERIES
-- ===================================================================
-- Uncomment these to verify the setup

-- SELECT 'patients' as table_name, COUNT(*) as record_count FROM patients
-- UNION ALL
-- SELECT 'clinics' as table_name, COUNT(*) as record_count FROM clinics
-- UNION ALL  
-- SELECT 'appointments' as table_name, COUNT(*) as record_count FROM appointments
-- UNION ALL
-- SELECT 'clinic_services' as table_name, COUNT(*) as record_count FROM clinic_services;

-- SELECT 
--     c.clinic_name,
--     COUNT(cs.id) as service_count
-- FROM clinics c
-- LEFT JOIN clinic_services cs ON c.id = cs.clinic_id
-- WHERE c.status = 'approved'
-- GROUP BY c.id, c.clinic_name
-- ORDER BY c.clinic_name;

-- Create clinic_payment_methods table
CREATE TABLE IF NOT EXISTS clinic_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'digital_wallet', 'bank_transfer', 'cash')),
    provider VARCHAR(100), -- e.g., 'Visa', 'Mastercard', 'GCash', 'PayMaya'
    account_details JSONB, -- Store encrypted payment account info
    is_enabled BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    processing_fee_percentage DECIMAL(5,2) DEFAULT 0.00, -- Processing fee as percentage
    minimum_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for clinic_payment_methods
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_clinic_id ON clinic_payment_methods(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_status ON clinic_payment_methods(status);
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_enabled ON clinic_payment_methods(is_enabled);
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_type ON clinic_payment_methods(method_type);

-- Enable RLS for clinic_payment_methods
ALTER TABLE clinic_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinic_payment_methods
CREATE POLICY "Clinics can manage their own payment methods" ON clinic_payment_methods
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM clinics WHERE id = clinic_payment_methods.clinic_id
        )
    );

CREATE POLICY "Patients can view enabled payment methods" ON clinic_payment_methods
    FOR SELECT USING (
        is_enabled = true AND status = 'active'
    );

-- Insert default payment methods for existing approved clinics
INSERT INTO clinic_payment_methods (clinic_id, method_type, provider, is_enabled, status)
SELECT 
    c.id,
    'credit_card',
    'Visa/Mastercard',
    true,
    'active'
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT DO NOTHING;

INSERT INTO clinic_payment_methods (clinic_id, method_type, provider, is_enabled, status)
SELECT 
    c.id,
    'digital_wallet',
    'GCash/PayMaya',
    true,
    'active'
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE patients IS 'Stores patient profile information and medical history';
COMMENT ON TABLE clinics IS 'Stores clinic profile information, services, and operational details';
COMMENT ON TABLE appointments IS 'Stores appointment bookings between patients and clinics';
COMMENT ON TABLE clinic_services IS 'Stores individual services offered by clinics with pricing';
COMMENT ON TABLE clinic_payment_methods IS 'Stores payment methods accepted by each clinic';

-- Setup completed successfully
SELECT '✅ Database setup completed successfully!' as status;
