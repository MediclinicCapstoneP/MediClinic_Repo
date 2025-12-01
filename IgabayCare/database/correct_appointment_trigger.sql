-- ===================================================================
-- CORRECT APPOINTMENT TOTAL AMOUNT TRIGGER
-- ===================================================================
-- This trigger automatically calculates total_amount from consultation_fee + booking_fee

-- 1) Create trigger function
CREATE OR REPLACE FUNCTION calculate_appointment_total_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate total_amount as consultation_fee + booking_fee
  NEW.total_amount := COALESCE(NEW.consultation_fee, 500.00) + COALESCE(NEW.booking_fee, 50.00);
  RETURN NEW;
END;
$$;

-- 2) Create trigger (ensure previous statement ended with semicolon)
CREATE TRIGGER calculate_appointment_total_trigger
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION calculate_appointment_total_amount();

-- 3) Update existing appointments to have correct totals
UPDATE appointments 
SET total_amount = COALESCE(consultation_fee, 500.00) + COALESCE(booking_fee, 50.00)
WHERE total_amount IS NULL OR 
     total_amount != (COALESCE(consultation_fee, 500.00) + COALESCE(booking_fee, 50.00));
