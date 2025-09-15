-- ===================================================================
-- FIX PRESCRIPTION RLS POLICIES FOR DOCTORS
-- This script adds RLS policies to allow doctors to create and manage prescriptions
-- ===================================================================

-- First, let's drop existing policies and recreate them with doctor support
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Clinics can view prescriptions for their patients" ON prescriptions;
DROP POLICY IF EXISTS "Clinics can manage prescriptions for their patients" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view their prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can manage their prescriptions" ON prescriptions;

-- ===================================================================
-- PRESCRIPTION POLICIES WITH DOCTOR SUPPORT
-- ===================================================================

-- 1. Patients can view their own prescriptions
CREATE POLICY "Patients can view their own prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = prescriptions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- 2. Clinics can view prescriptions for their patients
CREATE POLICY "Clinics can view prescriptions for their patients" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = prescriptions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- 3. Doctors can view prescriptions they created
CREATE POLICY "Doctors can view their prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

-- 4. Clinics can create/update/delete prescriptions for their patients
CREATE POLICY "Clinics can manage prescriptions for their patients" ON prescriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = prescriptions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

-- 5. Doctors can create/update/delete their own prescriptions
CREATE POLICY "Doctors can manage their prescriptions" ON prescriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
        )
    );

-- ===================================================================
-- PRESCRIPTION MEDICATIONS POLICIES WITH DOCTOR SUPPORT
-- ===================================================================

DROP POLICY IF EXISTS "Users can view prescription medications they have access to" ON prescription_medications;
DROP POLICY IF EXISTS "Clinics can manage prescription medications" ON prescription_medications;
DROP POLICY IF EXISTS "Doctors can view prescription medications" ON prescription_medications;
DROP POLICY IF EXISTS "Doctors can manage prescription medications" ON prescription_medications;

-- 1. Users can view prescription medications they have access to (patients, clinics, doctors)
CREATE POLICY "Users can view prescription medications they have access to" ON prescription_medications
    FOR SELECT USING (
        -- Patients can see medications for their own prescriptions
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN patients pt ON pt.id = p.patient_id
            WHERE p.id = prescription_medications.prescription_id 
            AND pt.user_id = auth.uid()
        )
        OR
        -- Clinics can see medications for prescriptions from their clinic
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_medications.prescription_id 
            AND c.user_id = auth.uid()
        )
        OR
        -- Doctors can see medications for prescriptions they created
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id 
            AND d.user_id = auth.uid()
        )
    );

-- 2. Clinics can manage prescription medications
CREATE POLICY "Clinics can manage prescription medications" ON prescription_medications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_medications.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

-- 3. Doctors can manage their prescription medications
CREATE POLICY "Doctors can manage prescription medications" ON prescription_medications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id 
            AND d.user_id = auth.uid()
        )
    );

-- ===================================================================
-- PRESCRIPTION DISPENSING LOG POLICIES WITH DOCTOR SUPPORT
-- ===================================================================

DROP POLICY IF EXISTS "Users can view dispensing logs they have access to" ON prescription_dispensing_log;
DROP POLICY IF EXISTS "Clinics can manage dispensing logs" ON prescription_dispensing_log;
DROP POLICY IF EXISTS "Doctors can view dispensing logs" ON prescription_dispensing_log;

-- 1. Users can view dispensing logs they have access to
CREATE POLICY "Users can view dispensing logs they have access to" ON prescription_dispensing_log
    FOR SELECT USING (
        -- Patients can see dispensing logs for their own prescriptions
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN patients pt ON pt.id = p.patient_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND pt.user_id = auth.uid()
        )
        OR
        -- Clinics can see dispensing logs for prescriptions from their clinic
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND c.user_id = auth.uid()
        )
        OR
        -- Doctors can see dispensing logs for prescriptions they created
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND d.user_id = auth.uid()
        )
    );

-- 2. Clinics can manage dispensing logs
CREATE POLICY "Clinics can manage dispensing logs" ON prescription_dispensing_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN clinics c ON c.id = p.clinic_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND c.user_id = auth.uid()
        )
    );

-- 3. Doctors can view dispensing logs for their prescriptions (read-only for doctors)
CREATE POLICY "Doctors can view dispensing logs" ON prescription_dispensing_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_dispensing_log.prescription_id 
            AND d.user_id = auth.uid()
        )
    );

-- ===================================================================
-- CREATE HELPER FUNCTION FOR DOCTOR PRESCRIPTION ACCESS
-- ===================================================================

-- Function to check if current user is a doctor who can create prescriptions
CREATE OR REPLACE FUNCTION can_doctor_create_prescription(
    doctor_user_id UUID,
    target_patient_id UUID,
    target_clinic_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    doctor_exists BOOLEAN := FALSE;
    clinic_association BOOLEAN := FALSE;
BEGIN
    -- Check if the user is a doctor
    SELECT EXISTS(
        SELECT 1 FROM doctors 
        WHERE user_id = doctor_user_id 
        AND status = 'active'
    ) INTO doctor_exists;
    
    IF NOT doctor_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Check if doctor is associated with the clinic (if clinic_id provided)
    IF target_clinic_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM doctors 
            WHERE user_id = doctor_user_id 
            AND (clinic_id = target_clinic_id OR clinic_id IS NULL)  -- Independent doctors can prescribe too
            AND status = 'active'
        ) INTO clinic_association;
        
        RETURN clinic_association;
    END IF;
    
    -- If no clinic specified, any active doctor can prescribe
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- UPDATE PRESCRIPTION CREATION POLICY FOR BETTER DOCTOR SUPPORT
-- ===================================================================

-- Drop and recreate the doctor management policy with additional checks
DROP POLICY IF EXISTS "Doctors can manage their prescriptions" ON prescriptions;

CREATE POLICY "Doctors can manage their prescriptions" ON prescriptions
    FOR ALL USING (
        -- Doctor can manage if they created the prescription
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
            AND doctors.status = 'active'
        )
    )
    WITH CHECK (
        -- Additional check for INSERT: ensure doctor can create prescriptions
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.user_id = auth.uid()
            AND doctors.status = 'active'
            AND (
                doctors.clinic_id = prescriptions.clinic_id 
                OR doctors.clinic_id IS NULL  -- Independent doctors
            )
        )
    );

-- ===================================================================
-- GRANT ADDITIONAL PERMISSIONS
-- ===================================================================

-- Ensure doctors can access the helper function
GRANT EXECUTE ON FUNCTION can_doctor_create_prescription(UUID, UUID, UUID) TO authenticated;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('prescriptions', 'prescription_medications', 'prescription_dispensing_log')
ORDER BY tablename, policyname;

SELECT '✅ Prescription RLS policies updated for doctor access!' as status;