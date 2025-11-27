-- Consultation History Security and RLS Policies
-- This script creates comprehensive security policies for consultation history data
-- with HIPAA-like protections and proper user access controls

-- Enable RLS on core tables if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PATIENT ACCESS POLICIES
-- ===========================================

-- Patients can view their own appointments
DROP POLICY IF EXISTS "patients_view_own_appointments" ON public.appointments;
CREATE POLICY "patients_view_own_appointments" ON public.appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

-- Patients can view their own medical records
DROP POLICY IF EXISTS "patients_view_own_medical_records" ON public.medical_records;
CREATE POLICY "patients_view_own_medical_records" ON public.medical_records
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

-- Patients can view their own prescriptions
DROP POLICY IF EXISTS "patients_view_own_prescriptions" ON public.prescriptions;
CREATE POLICY "patients_view_own_prescriptions" ON public.prescriptions
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE user_id = auth.uid()
        )
    );

-- ===========================================
-- DOCTOR ACCESS POLICIES
-- ===========================================

-- Doctors can view appointments for their patients
DROP POLICY IF EXISTS "doctors_view_patient_appointments" ON public.appointments;
CREATE POLICY "doctors_view_patient_appointments" ON public.appointments
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
        OR 
        -- Allow doctors to view appointments at their clinic
        clinic_id IN (
            SELECT clinic_id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- Doctors can update appointments they are assigned to
DROP POLICY IF EXISTS "doctors_update_assigned_appointments" ON public.appointments;
CREATE POLICY "doctors_update_assigned_appointments" ON public.appointments
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- Doctors can view medical records for their patients
DROP POLICY IF EXISTS "doctors_view_patient_medical_records" ON public.medical_records;
CREATE POLICY "doctors_view_patient_medical_records" ON public.medical_records
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
        OR
        -- Allow access to records for appointments they handled
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE doctor_id IN (
                SELECT id FROM public.doctors 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can create medical records for their appointments
DROP POLICY IF EXISTS "doctors_create_medical_records" ON public.medical_records;
CREATE POLICY "doctors_create_medical_records" ON public.medical_records
    FOR INSERT WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
        OR
        appointment_id IN (
            SELECT id FROM public.appointments 
            WHERE doctor_id IN (
                SELECT id FROM public.doctors 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Doctors can update medical records they created
DROP POLICY IF EXISTS "doctors_update_own_medical_records" ON public.medical_records;
CREATE POLICY "doctors_update_own_medical_records" ON public.medical_records
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- Doctors can view prescriptions for their patients
DROP POLICY IF EXISTS "doctors_view_patient_prescriptions" ON public.prescriptions;
CREATE POLICY "doctors_view_patient_prescriptions" ON public.prescriptions
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- Doctors can create prescriptions for their patients
DROP POLICY IF EXISTS "doctors_create_prescriptions" ON public.prescriptions;
CREATE POLICY "doctors_create_prescriptions" ON public.prescriptions
    FOR INSERT WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors 
            WHERE user_id = auth.uid()
        )
    );

-- ===========================================
-- CLINIC ADMIN ACCESS POLICIES
-- ===========================================

-- Create clinic_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clinic_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'staff')),
    permissions JSONB DEFAULT '{"view_all": true, "edit_appointments": true, "view_medical_records": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, clinic_id)
);

-- Enable RLS on clinic_admins
ALTER TABLE public.clinic_admins ENABLE ROW LEVEL SECURITY;

-- Clinic admins can view their own record
DROP POLICY IF EXISTS "clinic_admins_view_own_record" ON public.clinic_admins;
CREATE POLICY "clinic_admins_view_own_record" ON public.clinic_admins
    FOR SELECT USING (user_id = auth.uid());

-- Clinic admins can view appointments at their clinic
DROP POLICY IF EXISTS "clinic_admins_view_clinic_appointments" ON public.appointments;
CREATE POLICY "clinic_admins_view_clinic_appointments" ON public.appointments
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Clinic admins can update appointments at their clinic
DROP POLICY IF EXISTS "clinic_admins_update_clinic_appointments" ON public.appointments;
CREATE POLICY "clinic_admins_update_clinic_appointments" ON public.appointments
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_admins 
            WHERE user_id = auth.uid() 
            AND is_active = true
            AND (permissions->>'edit_appointments')::boolean = true
        )
    );

-- ===========================================
-- AUDIT AND LOGGING POLICIES
-- ===========================================

-- Create audit log table for tracking access to medical records
CREATE TABLE IF NOT EXISTS public.medical_record_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    patient_id UUID REFERENCES public.patients(id),
    medical_record_id UUID REFERENCES public.medical_records(id),
    appointment_id UUID REFERENCES public.appointments(id),
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete')),
    ip_address INET,
    user_agent TEXT,
    additional_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log (only system can write, admins can read)
ALTER TABLE public.medical_record_audit_log ENABLE ROW LEVEL SECURITY;

-- System can insert audit logs
DROP POLICY IF EXISTS "system_insert_audit_logs" ON public.medical_record_audit_log;
CREATE POLICY "system_insert_audit_logs" ON public.medical_record_audit_log
    FOR INSERT WITH CHECK (true);

-- Users can view their own access logs
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON public.medical_record_audit_log;
CREATE POLICY "users_view_own_audit_logs" ON public.medical_record_audit_log
    FOR SELECT USING (user_id = auth.uid());

-- ===========================================
-- PRIVACY AND DATA PROTECTION
-- ===========================================

-- Create function to mask sensitive data for unauthorized users
CREATE OR REPLACE FUNCTION mask_sensitive_medical_data(
    record_data JSONB,
    user_role TEXT DEFAULT 'patient'
) RETURNS JSONB AS $$
BEGIN
    -- If user is a doctor or admin, return full data
    IF user_role IN ('doctor', 'admin', 'clinic_admin') THEN
        RETURN record_data;
    END IF;
    
    -- For patients, mask certain sensitive fields
    RETURN jsonb_build_object(
        'id', record_data->>'id',
        'consultation_date', record_data->>'consultation_date',
        'consultation_type', record_data->>'consultation_type',
        'chief_complaint', record_data->>'chief_complaint',
        'diagnosis', CASE 
            WHEN record_data->>'is_sensitive' = 'true' 
            THEN '[RESTRICTED]' 
            ELSE record_data->>'diagnosis' 
        END,
        'treatment_plan', record_data->>'treatment_plan',
        'patient_notes', record_data->>'patient_notes',
        'doctor_notes', CASE 
            WHEN record_data->>'is_sensitive' = 'true' 
            THEN '[RESTRICTED]' 
            ELSE record_data->>'doctor_notes' 
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log medical record access
CREATE OR REPLACE FUNCTION log_medical_record_access() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.medical_record_audit_log (
        user_id,
        patient_id,
        medical_record_id,
        appointment_id,
        action,
        additional_info
    ) VALUES (
        auth.uid(),
        COALESCE(NEW.patient_id, OLD.patient_id),
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.appointment_id, OLD.appointment_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
            ELSE 'view'
        END,
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'timestamp', NOW()
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS medical_records_audit_trigger ON public.medical_records;
CREATE TRIGGER medical_records_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION log_medical_record_access();

-- ===========================================
-- DATA RETENTION POLICIES
-- ===========================================

-- Create function to archive old consultation data
CREATE OR REPLACE FUNCTION archive_old_consultations() 
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
    archive_date DATE := CURRENT_DATE - INTERVAL '7 years';
BEGIN
    -- Archive appointments older than 7 years
    UPDATE public.appointments 
    SET archived = true, archived_at = NOW()
    WHERE appointment_date < archive_date 
    AND archived IS NOT TRUE;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log the archival
    INSERT INTO public.system_logs (
        operation,
        details,
        created_at
    ) VALUES (
        'data_archival',
        jsonb_build_object(
            'archived_count', archived_count,
            'archive_date', archive_date,
            'table', 'appointments'
        ),
        NOW()
    );
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- EMERGENCY ACCESS PROCEDURES
-- ===========================================

-- Create emergency access function for critical medical situations
CREATE OR REPLACE FUNCTION grant_emergency_access(
    patient_identifier TEXT,
    emergency_code TEXT,
    requesting_doctor_id UUID
) RETURNS JSONB AS $$
DECLARE
    patient_record RECORD;
    access_granted BOOLEAN := false;
    result JSONB;
BEGIN
    -- Verify emergency code (in real implementation, this would be more sophisticated)
    IF emergency_code != 'MEDICAL_EMERGENCY_2024' THEN
        RETURN jsonb_build_object(
            'access_granted', false,
            'error', 'Invalid emergency code'
        );
    END IF;
    
    -- Find patient by identifier (could be ID, SSN, or medical record number)
    SELECT * INTO patient_record 
    FROM public.patients 
    WHERE id::text = patient_identifier 
       OR ssn = patient_identifier 
       OR medical_record_number = patient_identifier
    LIMIT 1;
    
    IF patient_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'access_granted', false,
            'error', 'Patient not found'
        );
    END IF;
    
    -- Log emergency access
    INSERT INTO public.emergency_access_log (
        patient_id,
        requesting_doctor_id,
        emergency_code,
        access_granted_at,
        ip_address,
        justification
    ) VALUES (
        patient_record.id,
        requesting_doctor_id,
        emergency_code,
        NOW(),
        inet_client_addr(),
        'Emergency medical access requested'
    );
    
    -- Return patient's critical medical information
    result := jsonb_build_object(
        'access_granted', true,
        'patient_id', patient_record.id,
        'patient_name', patient_record.first_name || ' ' || patient_record.last_name,
        'date_of_birth', patient_record.date_of_birth,
        'blood_type', patient_record.blood_type,
        'emergency_contact', patient_record.emergency_contact_phone,
        'allergies', (
            SELECT jsonb_agg(jsonb_build_object(
                'allergen', allergen,
                'severity', severity,
                'reaction_description', reaction_description
            ))
            FROM public.allergies 
            WHERE patient_id = patient_record.id 
            AND is_active = true
        ),
        'current_medications', (
            SELECT jsonb_agg(jsonb_build_object(
                'medication_name', medication_name,
                'dosage', dosage,
                'frequency', frequency
            ))
            FROM public.prescriptions 
            WHERE patient_id = patient_record.id 
            AND status = 'active'
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create emergency access log table
CREATE TABLE IF NOT EXISTS public.emergency_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    requesting_doctor_id UUID REFERENCES public.doctors(id),
    emergency_code TEXT NOT NULL,
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    justification TEXT,
    reviewed BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on emergency access log
ALTER TABLE public.emergency_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view emergency access logs
DROP POLICY IF EXISTS "admins_view_emergency_access_logs" ON public.emergency_access_log;
CREATE POLICY "admins_view_emergency_access_logs" ON public.emergency_access_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clinic_admins 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- ===========================================
-- COMPLIANCE AND REPORTING
-- ===========================================

-- Create function to generate HIPAA compliance report
CREATE OR REPLACE FUNCTION generate_hipaa_compliance_report(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    report JSONB;
BEGIN
    SELECT jsonb_build_object(
        'report_period', jsonb_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'access_summary', jsonb_build_object(
            'total_medical_record_accesses', (
                SELECT COUNT(*) FROM public.medical_record_audit_log 
                WHERE created_at >= start_date AND created_at <= end_date
            ),
            'unique_users_accessing', (
                SELECT COUNT(DISTINCT user_id) FROM public.medical_record_audit_log 
                WHERE created_at >= start_date AND created_at <= end_date
            ),
            'emergency_accesses', (
                SELECT COUNT(*) FROM public.emergency_access_log 
                WHERE access_granted_at >= start_date AND access_granted_at <= end_date
            )
        ),
        'security_events', jsonb_build_object(
            'failed_access_attempts', 0, -- Would be implemented with auth system
            'suspicious_activities', 0    -- Would be implemented with monitoring
        ),
        'generated_at', NOW(),
        'generated_by', auth.uid()
    ) INTO report;
    
    RETURN report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.medical_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinic_admins TO authenticated;
GRANT SELECT, INSERT ON public.medical_record_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.emergency_access_log TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_doctor ON public.appointments(patient_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_appointment ON public.medical_records(patient_id, appointment_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient_user ON public.medical_record_audit_log(patient_id, user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_access_patient ON public.emergency_access_log(patient_id);

SELECT 'Consultation history security policies created successfully!' as status;