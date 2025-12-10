-- ===================================================================
-- PRESCRIPTIONS AND MEDICATIONS SCHEMA
-- ===================================================================
-- This script creates tables for managing doctor prescriptions for patients

-- ===================================================================
-- 1. PRESCRIPTIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID, -- Future reference to doctors table
    
    -- Prescription details
    prescription_number TEXT UNIQUE NOT NULL DEFAULT ('RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
    
    -- Doctor information
    prescribing_doctor_name TEXT NOT NULL,
    prescribing_doctor_license TEXT,
    doctor_specialty TEXT,
    
    -- Prescription metadata
    diagnosis TEXT,
    patient_symptoms TEXT,
    clinical_notes TEXT,
    
    -- Prescription status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    
    -- Dates
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE, -- Prescription expiry date
    
    -- Instructions
    general_instructions TEXT,
    dietary_restrictions TEXT,
    follow_up_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. PRESCRIPTION MEDICATIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.prescription_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Medication details
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    medication_type TEXT, -- tablet, capsule, syrup, injection, etc.
    strength TEXT NOT NULL, -- e.g., "500mg", "10ml", "250mg/5ml"
    form TEXT, -- tablet, capsule, syrup, cream, etc.
    
    -- Dosage instructions
    dosage TEXT NOT NULL, -- e.g., "1 tablet", "2 capsules", "5ml"
    frequency TEXT NOT NULL, -- e.g., "twice daily", "every 8 hours", "as needed"
    duration TEXT NOT NULL, -- e.g., "7 days", "2 weeks", "as needed"
    timing TEXT, -- e.g., "after meals", "before sleep", "on empty stomach"
    
    -- Additional instructions
    special_instructions TEXT,
    side_effects TEXT,
    precautions TEXT,
    
    -- Quantities
    quantity_prescribed INTEGER NOT NULL DEFAULT 1,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. PRESCRIPTION DISPENSING LOG (Optional - for pharmacy integration)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.prescription_dispensing_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    medication_id UUID REFERENCES public.prescription_medications(id) ON DELETE CASCADE NOT NULL,
    
    -- Dispensing details
    pharmacy_name TEXT,
    pharmacist_name TEXT,
    dispensed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dispensed_quantity INTEGER NOT NULL,
    
    -- Notes
    pharmacist_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number);

-- Prescription medications indexes
CREATE INDEX IF NOT EXISTS idx_prescription_medications_prescription_id ON prescription_medications(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_medications_status ON prescription_medications(status);
CREATE INDEX IF NOT EXISTS idx_prescription_medications_name ON prescription_medications(medication_name);

-- Dispensing log indexes
CREATE INDEX IF NOT EXISTS idx_dispensing_log_prescription_id ON prescription_dispensing_log(prescription_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_log_medication_id ON prescription_dispensing_log(medication_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_log_date ON prescription_dispensing_log(dispensed_date);

-- ===================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===================================================================

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_dispensing_log ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 6. CREATE RLS POLICIES
-- ===================================================================

-- Prescriptions policies
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
CREATE POLICY "Patients can view their own prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = prescriptions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can view prescriptions for their patients" ON prescriptions;
CREATE POLICY "Clinics can view prescriptions for their patients" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = prescriptions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can manage prescriptions for their patients" ON prescriptions;
CREATE POLICY "Clinics can manage prescriptions for their patients" ON prescriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = prescriptions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- Prescription medications policies
DROP POLICY IF EXISTS "Users can view prescription medications they have access to" ON prescription_medications;
CREATE POLICY "Users can view prescription medications they have access to" ON prescription_medications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN patients pt ON pt.id = p.patient_id
            WHERE p.id = prescription_medications.prescription_id 
            AND pt.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_medications.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clinics can manage prescription medications" ON prescription_medications;
CREATE POLICY "Clinics can manage prescription medications" ON prescription_medications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_medications.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can manage prescription medications" ON prescription_medications;
CREATE POLICY "Doctors can manage prescription medications" ON prescription_medications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id
            AND d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id
            AND d.user_id = auth.uid()
        )
    );

-- Dispensing log policies
DROP POLICY IF EXISTS "Users can view dispensing logs they have access to" ON prescription_dispensing_log;
CREATE POLICY "Users can view dispensing logs they have access to" ON prescription_dispensing_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN patients pt ON pt.id = p.patient_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND pt.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

-- ===================================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================================================

CREATE TRIGGER update_prescriptions_updated_at 
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_medications_updated_at 
    BEFORE UPDATE ON prescription_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 8. GRANT PERMISSIONS
-- ===================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON prescription_medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON prescription_dispensing_log TO authenticated;

-- ===================================================================
-- 9. CREATE HELPER FUNCTIONS
-- ===================================================================

-- Function to get patient prescriptions with medication details
CREATE OR REPLACE FUNCTION get_patient_prescriptions(patient_user_id UUID)
RETURNS TABLE (
    prescription_id UUID,
    prescription_number TEXT,
    appointment_id UUID,
    prescribing_doctor_name TEXT,
    doctor_specialty TEXT,
    diagnosis TEXT,
    prescribed_date DATE,
    status TEXT,
    medications JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as prescription_id,
        p.prescription_number,
        p.appointment_id,
        p.prescribing_doctor_name,
        p.doctor_specialty,
        p.diagnosis,
        p.prescribed_date,
        p.status,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pm.id,
                    'medication_name', pm.medication_name,
                    'strength', pm.strength,
                    'dosage', pm.dosage,
                    'frequency', pm.frequency,
                    'duration', pm.duration,
                    'timing', pm.timing,
                    'special_instructions', pm.special_instructions
                )
            ) FILTER (WHERE pm.id IS NOT NULL),
            '[]'::jsonb
        ) as medications
    FROM prescriptions p
    JOIN patients pt ON pt.id = p.patient_id
    LEFT JOIN prescription_medications pm ON pm.prescription_id = p.id
    WHERE pt.user_id = patient_user_id
    GROUP BY p.id, p.prescription_number, p.appointment_id, p.prescribing_doctor_name, 
             p.doctor_specialty, p.diagnosis, p.prescribed_date, p.status
    ORDER BY p.prescribed_date DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if prescription is expired
CREATE OR REPLACE FUNCTION is_prescription_expired(prescription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    expiry_date DATE;
BEGIN
    SELECT valid_until INTO expiry_date 
    FROM prescriptions 
    WHERE id = prescription_id;
    
    IF expiry_date IS NULL THEN
        -- If no expiry date, assume 30 days from prescribed date
        SELECT (prescribed_date + INTERVAL '30 days')::DATE INTO expiry_date
        FROM prescriptions 
        WHERE id = prescription_id;
    END IF;
    
    RETURN expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- ===================================================================

-- Insert sample prescription data (commented out for production)
/*
INSERT INTO prescriptions (
    appointment_id, patient_id, clinic_id, prescribing_doctor_name, 
    doctor_specialty, diagnosis, patient_symptoms, clinical_notes,
    prescribed_date, valid_until, general_instructions
) VALUES (
    -- You'll need to replace these UUIDs with actual appointment/patient/clinic IDs
    'appointment-uuid-here'::UUID,
    'patient-uuid-here'::UUID,
    'clinic-uuid-here'::UUID,
    'Dr. John Smith',
    'Internal Medicine',
    'Upper Respiratory Tract Infection',
    'Cough, fever, sore throat',
    'Patient presents with typical URTI symptoms. No complications noted.',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'Take all medications as prescribed. Rest and stay hydrated. Return if symptoms worsen.'
);

-- Sample medications for the prescription
INSERT INTO prescription_medications (
    prescription_id, medication_name, strength, dosage, frequency, duration, timing, special_instructions
) VALUES 
    (
        (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1),
        'Amoxicillin',
        '500mg',
        '1 capsule',
        'Three times daily',
        '7 days',
        'After meals',
        'Complete the full course even if symptoms improve'
    ),
    (
        (SELECT id FROM prescriptions ORDER BY created_at DESC LIMIT 1),
        'Paracetamol',
        '500mg',
        '1-2 tablets',
        'Every 6 hours as needed',
        'As needed for fever/pain',
        'Can be taken with or without food',
        'Do not exceed 8 tablets in 24 hours'
    );
*/

SELECT '✅ Prescriptions schema created successfully!' as status;