-- ===================================================================
-- PAYMENT SYSTEM DATABASE SETUP
-- ===================================================================
-- This script creates the necessary tables and policies for the payment system
-- including clinic payment methods, patient payment details, and transactions

-- ===================================================================
-- 1. CLINIC PAYMENT METHODS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS clinic_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment method configuration
    method_type TEXT NOT NULL CHECK (method_type IN ('gcash', 'paymaya', 'bank_transfer', 'credit_card', 'debit_card', 'cash')),
    is_enabled BOOLEAN DEFAULT true,
    
    -- Method-specific details
    account_number TEXT, -- For GCash/PayMaya phone numbers or bank account numbers
    account_name TEXT,   -- Account holder name
    bank_name TEXT,      -- For bank transfers
    branch_code TEXT,    -- Bank branch code
    qr_code_url TEXT,    -- For QR code payments (GCash/PayMaya)
    
    -- Additional configuration
    minimum_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_amount DECIMAL(10,2),
    processing_fee_percentage DECIMAL(5,2) DEFAULT 0.00, -- Clinic's processing fee
    processing_fee_fixed DECIMAL(10,2) DEFAULT 0.00,     -- Fixed fee per transaction
    
    -- Instructions and notes
    payment_instructions TEXT,
    notes TEXT,
    
    -- Status and metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique payment methods per clinic
    UNIQUE(clinic_id, method_type)
);

-- ===================================================================
-- 2. PAYMENT TRANSACTIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Transaction references
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    clinic_payment_method_id UUID REFERENCES clinic_payment_methods(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_number TEXT UNIQUE NOT NULL, -- Generated unique transaction ID
    payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'paymaya', 'bank_transfer', 'credit_card', 'debit_card', 'cash')),
    
    -- Amount breakdown
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    booking_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- External payment references
    external_transaction_id TEXT, -- Payment gateway transaction ID
    external_reference_number TEXT, -- Reference from payment provider
    
    -- Payment details
    payment_date TIMESTAMP WITH TIME ZONE,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    
    -- Payer information
    payer_name TEXT,
    payer_phone TEXT,
    payer_email TEXT,
    
    -- Additional data
    payment_proof_url TEXT, -- Screenshot or receipt upload
    notes TEXT,
    failure_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. PATIENT PAYMENT METHODS TABLE (Optional - for saved methods)
-- ===================================================================
CREATE TABLE IF NOT EXISTS patient_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment method details
    method_type TEXT NOT NULL CHECK (method_type IN ('gcash', 'paymaya', 'credit_card', 'debit_card')),
    account_number TEXT NOT NULL, -- Phone number for GCash/PayMaya, masked card number for cards
    account_name TEXT,
    
    -- Card-specific fields (encrypted/tokenized)
    card_last_four TEXT,     -- Last 4 digits of card
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    card_brand TEXT,         -- Visa, Mastercard, etc.
    
    -- Security and preferences
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    nickname TEXT,          -- User-friendly name for the payment method
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique payment methods per patient
    UNIQUE(patient_id, method_type, account_number)
);

-- ===================================================================
-- 4. PAYMENT FEES CONFIGURATION TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS payment_fees_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Fee configuration
    payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'paymaya', 'bank_transfer', 'credit_card', 'debit_card', 'cash')),
    
    -- Platform fees (what the platform charges)
    platform_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    platform_fee_fixed DECIMAL(10,2) DEFAULT 0.00,
    
    -- Gateway fees (what payment providers charge)
    gateway_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    gateway_fee_fixed DECIMAL(10,2) DEFAULT 0.00,
    
    -- Minimum and maximum amounts
    minimum_transaction_amount DECIMAL(10,2) DEFAULT 1.00,
    maximum_transaction_amount DECIMAL(10,2) DEFAULT 100000.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique configuration per payment method
    UNIQUE(payment_method)
);

-- ===================================================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_clinic_id ON clinic_payment_methods(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_payment_methods_status ON clinic_payment_methods(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id ON payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_clinic_id ON payment_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment_id ON payment_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_number ON payment_transactions(transaction_number);

CREATE INDEX IF NOT EXISTS idx_patient_payment_methods_patient_id ON patient_payment_methods(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payment_methods_default ON patient_payment_methods(patient_id, is_default);

-- ===================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE clinic_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fees_config ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Clinic Payment Methods Policies
CREATE POLICY "Clinics can manage their own payment methods" ON clinic_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = clinic_payment_methods.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can view clinic payment methods" ON clinic_payment_methods
    FOR SELECT USING (status = 'active' AND is_enabled = true);

-- Payment Transactions Policies
CREATE POLICY "Patients can view their own transactions" ON payment_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = payment_transactions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can view transactions for their clinic" ON payment_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = payment_transactions.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can create transactions for themselves" ON payment_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = payment_transactions.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "System can update transaction status" ON payment_transactions
    FOR UPDATE USING (true) WITH CHECK (true);

-- Patient Payment Methods Policies
CREATE POLICY "Patients can manage their own payment methods" ON patient_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = patient_payment_methods.patient_id 
            AND patients.user_id = auth.uid()
        )
    );

-- Payment Fees Config Policies (Read-only for all authenticated users)
CREATE POLICY "Authenticated users can view payment fees" ON payment_fees_config
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ===================================================================
-- 8. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER update_clinic_payment_methods_updated_at 
    BEFORE UPDATE ON clinic_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_payment_methods_updated_at 
    BEFORE UPDATE ON patient_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_fees_config_updated_at 
    BEFORE UPDATE ON payment_fees_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 9. INSERT DEFAULT PAYMENT FEES CONFIGURATION
-- ===================================================================
INSERT INTO payment_fees_config (payment_method, platform_fee_percentage, gateway_fee_percentage, gateway_fee_fixed, description) VALUES
    ('gcash', 0.00, 2.50, 5.00, 'GCash payments with 2.5% gateway fee + ₱5 fixed fee'),
    ('paymaya', 0.00, 2.50, 5.00, 'PayMaya payments with 2.5% gateway fee + ₱5 fixed fee'),
    ('credit_card', 0.00, 3.50, 10.00, 'Credit card payments with 3.5% gateway fee + ₱10 fixed fee'),
    ('debit_card', 0.00, 2.00, 5.00, 'Debit card payments with 2.0% gateway fee + ₱5 fixed fee'),
    ('bank_transfer', 0.00, 1.00, 15.00, 'Bank transfer with 1.0% gateway fee + ₱15 fixed fee'),
    ('cash', 0.00, 0.00, 0.00, 'Cash payments (no gateway fees)')
ON CONFLICT (payment_method) DO NOTHING;

-- ===================================================================
-- 10. CREATE FUNCTION TO GENERATE TRANSACTION NUMBERS
-- ===================================================================
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    transaction_num TEXT;
BEGIN
    -- Generate transaction number with format: TXN-YYYYMMDD-XXXXXX
    transaction_num := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM payment_transactions WHERE transaction_number = transaction_num) LOOP
        transaction_num := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    END LOOP;
    
    RETURN transaction_num;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 11. CREATE FUNCTION TO CALCULATE FEES
-- ===================================================================
CREATE OR REPLACE FUNCTION calculate_payment_fees(
    p_payment_method TEXT,
    p_amount DECIMAL(10,2)
)
RETURNS TABLE (
    gateway_fee DECIMAL(10,2),
    total_with_fees DECIMAL(10,2)
) AS $$
DECLARE
    config RECORD;
    calculated_gateway_fee DECIMAL(10,2) := 0.00;
BEGIN
    -- Get fee configuration
    SELECT * INTO config 
    FROM payment_fees_config 
    WHERE payment_method = p_payment_method AND is_active = true;
    
    IF FOUND THEN
        -- Calculate gateway fee
        calculated_gateway_fee := (p_amount * config.gateway_fee_percentage / 100) + config.gateway_fee_fixed;
    END IF;
    
    RETURN QUERY SELECT 
        calculated_gateway_fee,
        p_amount + calculated_gateway_fee;
END;
$$ LANGUAGE plpgsql;