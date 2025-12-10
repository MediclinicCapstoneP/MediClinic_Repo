-- ===================================================================
-- FIX PRESCRIPTION MEDICATIONS RLS POLICY FOR DOCTORS
-- This script fixes the RLS policy to allow doctors to INSERT medications
-- The issue is that the policy needs a WITH CHECK clause for INSERT operations
-- ===================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Doctors can manage prescription medications" ON prescription_medications;

-- Recreate the policy with both USING and WITH CHECK clauses
-- USING is for SELECT/UPDATE/DELETE (checking existing rows)
-- WITH CHECK is for INSERT/UPDATE (checking new/modified rows)
CREATE POLICY "Doctors can manage prescription medications" ON prescription_medications
    FOR ALL 
    USING (
        -- For SELECT, UPDATE, DELETE: check if prescription exists and is linked to doctor
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id
            AND d.user_id = auth.uid()
            AND d.status = 'active'
        )
    )
    WITH CHECK (
        -- For INSERT, UPDATE: check if prescription exists and is linked to doctor
        -- This is critical for INSERT operations
        EXISTS (
            SELECT 1 FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            WHERE p.id = prescription_medications.prescription_id
            AND d.user_id = auth.uid()
            AND d.status = 'active'
        )
    );

-- Also ensure the prescription policy allows doctors to create prescriptions
-- Drop and recreate to ensure WITH CHECK is properly set
DROP POLICY IF EXISTS "Doctors can manage their prescriptions" ON prescriptions;

CREATE POLICY "Doctors can manage their prescriptions" ON prescriptions
    FOR ALL 
    USING (
        -- For SELECT, UPDATE, DELETE: check if doctor owns the prescription
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
            AND doctors.status = 'active'
        )
    )
    WITH CHECK (
        -- For INSERT: check if user is an active doctor (doctor_id matches)
        -- For UPDATE: check if doctor owns the prescription
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = prescriptions.doctor_id 
            AND doctors.user_id = auth.uid()
            AND doctors.status = 'active'
        )
    );

-- Verify the policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE WHEN qual IS NOT NULL THEN 'Has USING clause' ELSE 'No USING clause' END as using_status,
    CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause' ELSE 'No WITH CHECK clause' END as with_check_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('prescriptions', 'prescription_medications')
AND policyname LIKE '%doctor%'
ORDER BY tablename, policyname;

SELECT '✅ Prescription medications RLS policy fixed for doctor INSERT operations!' as status;

