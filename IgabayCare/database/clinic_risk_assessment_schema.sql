-- ===================================================================
-- CLINIC RISK ASSESSMENT SCHEMA
-- ===================================================================
-- This script adds ML risk assessment fields to the clinics table
-- and creates supporting tables for risk assessment tracking

-- Add risk assessment fields to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,2) CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(25) DEFAULT 'VERIFICATION_REQUIRED' CHECK (
  account_status IN ('ACTIVE_LIMITED', 'RESTRICTED', 'VERIFICATION_REQUIRED')
),
ADD COLUMN IF NOT EXISTS risk_flags JSONB,
ADD COLUMN IF NOT EXISTS risk_assessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS risk_model_version VARCHAR(20) DEFAULT '1.0';

-- Create clinic risk assessment log table for audit trail
CREATE TABLE IF NOT EXISTS clinic_risk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    assessment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version VARCHAR(20) NOT NULL,
    risk_score DECIMAL(3,2) NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    account_status VARCHAR(25) NOT NULL CHECK (
      account_status IN ('ACTIVE_LIMITED', 'RESTRICTED', 'VERIFICATION_REQUIRED')
    ),
    risk_flags JSONB,
    feature_vector JSONB, -- Store the extracted features for analysis
    assessment_reason TEXT, -- Human-readable explanation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinics_risk_score ON clinics(risk_score);
CREATE INDEX IF NOT EXISTS idx_clinics_risk_level ON clinics(risk_level);
CREATE INDEX IF NOT EXISTS idx_clinics_account_status ON clinics(account_status);
CREATE INDEX IF NOT EXISTS idx_clinic_risk_assessments_clinic_id ON clinic_risk_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_risk_assessments_timestamp ON clinic_risk_assessments(assessment_timestamp);

-- Enable RLS for risk assessments table
ALTER TABLE clinic_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk assessments (read-only for system, write for service role)
CREATE POLICY "System can view all risk assessments" ON clinic_risk_assessments
    FOR SELECT USING (true);

CREATE POLICY "Service can insert risk assessments" ON clinic_risk_assessments
    FOR INSERT WITH CHECK (true);

-- Update existing clinics to have default risk assessment values
UPDATE clinics 
SET 
    risk_score = 0.5,
    risk_level = 'MEDIUM',
    account_status = 'VERIFICATION_REQUIRED',
    risk_assessed_at = NOW(),
    risk_model_version = '1.0'
WHERE risk_score IS NULL;

-- Comments for documentation
COMMENT ON COLUMN clinics.risk_score IS 'ML-calculated risk score (0.0-1.0) based on clinic metadata';
COMMENT ON COLUMN clinics.risk_level IS 'Risk category: LOW, MEDIUM, or HIGH';
COMMENT ON COLUMN clinics.account_status IS 'Account capability status: ACTIVE_LIMITED, RESTRICTED, or VERIFICATION_REQUIRED';
COMMENT ON COLUMN clinics.risk_flags IS 'JSON array of specific risk indicators and flags';
COMMENT ON COLUMN clinics.risk_assessed_at IS 'Timestamp of last risk assessment';
COMMENT ON COLUMN clinics.risk_model_version IS 'Version of the ML model used for assessment';
COMMENT ON TABLE clinic_risk_assessments IS 'Audit log of all risk assessments for compliance and analysis';
