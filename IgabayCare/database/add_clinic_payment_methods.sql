-- ===================================================================
-- ADD CLINIC PAYMENT METHODS DATA
-- This script adds payment method configurations for existing clinics
-- ===================================================================

-- First, check if we have any clinics
DO $$
BEGIN
    -- Add payment methods for all existing approved clinics
    INSERT INTO clinic_payment_methods (
        clinic_id,
        method_type,
        is_enabled,
        status,
        minimum_amount,
        maximum_amount,
        processing_fee_percentage,
        processing_fee_fixed,
        account_details,
        created_at,
        updated_at
    )
    SELECT 
        c.id as clinic_id,
        payment_method.method_type,
        true as is_enabled,
        'active' as status,
        payment_method.min_amount,
        payment_method.max_amount,
        payment_method.fee_percentage,
        payment_method.fee_fixed,
        payment_method.account_details,
        NOW() as created_at,
        NOW() as updated_at
    FROM clinics c
    CROSS JOIN (
        VALUES 
            ('gcash', 50.00, 50000.00, 2.50, 5.00, '{"account_name": "Clinic GCash", "account_number": "09XX-XXX-XXXX"}'),
            ('paymaya', 50.00, 50000.00, 2.50, 5.00, '{"account_name": "Clinic PayMaya", "account_number": "09XX-XXX-XXXX"}'),
            ('cash', 0.00, 100000.00, 0.00, 0.00, '{"instructions": "Pay at the clinic reception"}'),
            ('bank_transfer', 100.00, 100000.00, 1.00, 15.00, '{"bank_name": "BPI", "account_name": "Clinic Account", "account_number": "XXXX-XXXX-XXXX"}')
    ) AS payment_method(method_type, min_amount, max_amount, fee_percentage, fee_fixed, account_details)
    WHERE c.status = 'approved'
    ON CONFLICT (clinic_id, method_type) DO NOTHING;

    RAISE NOTICE 'Payment methods added for existing clinics';
END $$;

-- Verify the data was inserted
SELECT 
    c.clinic_name,
    cpm.method_type,
    cpm.is_enabled,
    cpm.status,
    cpm.minimum_amount,
    cpm.maximum_amount
FROM clinic_payment_methods cpm
JOIN clinics c ON c.id = cpm.clinic_id
ORDER BY c.clinic_name, cpm.method_type;
