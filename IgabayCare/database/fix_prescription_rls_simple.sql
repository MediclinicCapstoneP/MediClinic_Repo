-- ===================================================================
-- SIMPLIFIED PRESCRIPTION RLS FIX FOR DOCTORS
-- Only fixes policies for tables that exist
-- ===================================================================

-- Check what prescription tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%prescription%'
ORDER BY table_name;

-- First, let's drop existing policies for prescriptions table only
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Clinics can view prescriptions for their patients" ON prescriptions;
DROP POLICY IF EXISTS "Clinics can manage prescriptions for their patients" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view their prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can manage their prescriptions" ON prescriptions;

-- ===================================================================
-- PRESCRIPTION POLICIES WITH DOCTOR SUPPORT (PRESCRIPTIONS TABLE ONLY)
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
-- This is the key policy that allows doctors to create prescriptions
CREATE POLICY "Doctors can manage their prescriptions" ON prescriptions
    FOR ALL USING (
        -- Doctor can manage if they created the prescription (for existing prescriptions)
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
            AND doctors.status = 'active'
        )
        OR
        -- For new prescriptions, allow any active doctor to create
        (prescriptions.doctor_id IS NULL AND EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.user_id = auth.uid()
            AND doctors.status = 'active'
        ))
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
-- GRANT ADDITIONAL PERMISSIONS
-- ===================================================================

-- Ensure doctors can access the helper function
GRANT EXECUTE ON FUNCTION can_doctor_create_prescription(UUID, UUID, UUID) TO authenticated;

-- Make sure authenticated users can access prescriptions table
GRANT SELECT, INSERT, UPDATE, DELETE ON prescriptions TO authenticated;

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
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'prescriptions'
ORDER BY policyname;

-- Show the structure of the prescriptions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'prescriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ Prescription RLS policies updated for doctor access (prescriptions table only)!' as status;