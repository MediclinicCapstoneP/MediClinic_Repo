-- ===================================================================
-- ADD PAYMENT COLUMNS TO APPOINTMENTS TABLE
-- ===================================================================
-- This migration adds payment-related columns to the existing appointments table
-- to support the PayMongo GCash payment integration

-- Add payment-related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 550.00,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmation_code TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS external_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Add indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_method ON appointments(payment_method);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_intent_id ON appointments(payment_intent_id);

-- Add comments for documentation
COMMENT ON COLUMN appointments.consultation_fee IS 'Base consultation fee for the appointment';
COMMENT ON COLUMN appointments.booking_fee IS 'Booking/service fee for the appointment';
COMMENT ON COLUMN appointments.total_amount IS 'Total amount including all fees';
COMMENT ON COLUMN appointments.payment_method IS 'Payment method used (gcash, cash, etc.)';
COMMENT ON COLUMN appointments.payment_status IS 'Current payment status';
COMMENT ON COLUMN appointments.payment_intent_id IS 'External payment intent ID (e.g., PayMongo)';
COMMENT ON COLUMN appointments.payment_confirmation_code IS 'Confirmation code for payment';
COMMENT ON COLUMN appointments.payment_date IS 'Date when payment was completed';
COMMENT ON COLUMN appointments.external_transaction_id IS 'External transaction reference';
COMMENT ON COLUMN appointments.payment_notes IS 'Additional payment-related notes';

-- Update existing appointments to have default values for backward compatibility
UPDATE appointments 
SET 
    consultation_fee = 500.00,
    booking_fee = 50.00,
    total_amount = 550.00,
    payment_status = CASE 
        WHEN status = 'completed' THEN 'paid'
        WHEN status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END
WHERE consultation_fee IS NULL OR booking_fee IS NULL OR total_amount IS NULL;

-- Create trigger to automatically calculate total amount when fees change
CREATE OR REPLACE FUNCTION calculate_appointment_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total amount when consultation_fee or booking_fee changes
    IF TG_OP = 'UPDATE' THEN
        IF NEW.consultation_fee IS DISTINCT FROM OLD.consultation_fee OR 
           NEW.booking_fee IS DISTINCT FROM OLD.booking_fee THEN
            NEW.total_amount := COALESCE(NEW.consultation_fee, 0) + COALESCE(NEW.booking_fee, 0);
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        -- Calculate total for new appointments
        NEW.total_amount := COALESCE(NEW.consultation_fee, 500) + COALESCE(NEW.booking_fee, 50);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total amount
DROP TRIGGER IF EXISTS calculate_appointment_total_trigger ON appointments;
CREATE TRIGGER calculate_appointment_total_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION calculate_appointment_total_amount();

-- Update RLS policies to handle payment columns
-- (Existing policies should still work, but we'll add payment-specific ones if needed)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment columns successfully added to appointments table';
    RAISE NOTICE 'Existing appointments updated with default payment values';
    RAISE NOTICE 'Trigger created to automatically calculate total amounts';
END $$;
