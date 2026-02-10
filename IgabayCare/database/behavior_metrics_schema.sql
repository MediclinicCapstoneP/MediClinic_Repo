-- Behavioral Biometrics Database Schema
-- Tables for storing behavioral metrics and failed authentication attempts

-- Table for storing behavioral feature snapshots
CREATE TABLE IF NOT EXISTS behavior_metrics (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id VARCHAR(255) NOT NULL,
    features JSONB NOT NULL,
    label INTEGER, -- 0 for bot, 1 for human, NULL for unlabeled
    label_source VARCHAR(50), -- 'auto', 'manual', 'synthetic'
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PostgreSQL indexes for behavior_metrics
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_session_id ON behavior_metrics (session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_captured_at ON behavior_metrics (captured_at);
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_label ON behavior_metrics (label);
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_created_at ON behavior_metrics (created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_features_gin ON behavior_metrics USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_behavior_metrics_session_label ON behavior_metrics (session_id, label);

-- Table for storing failed authentication attempts
CREATE TABLE IF NOT EXISTS behavior_failed_attempts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id VARCHAR(255),
    behavior_metric_id BIGINT REFERENCES behavior_metrics(id) ON DELETE SET NULL,
    snapshot JSONB NOT NULL,
    reason TEXT,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PostgreSQL indexes for behavior_failed_attempts
CREATE INDEX IF NOT EXISTS idx_behavior_failed_session_id ON behavior_failed_attempts (session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_failed_metric_id ON behavior_failed_attempts (behavior_metric_id);
CREATE INDEX IF NOT EXISTS idx_behavior_failed_captured_at ON behavior_failed_attempts (captured_at);
CREATE INDEX IF NOT EXISTS idx_behavior_failed_created_at ON behavior_failed_attempts (created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_failed_snapshot_gin ON behavior_failed_attempts USING GIN (snapshot);

-- Table for storing model performance metrics
CREATE TABLE IF NOT EXISTS behavior_model_metrics (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    model_version VARCHAR(50) NOT NULL,
    accuracy FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    confusion_matrix JSONB,
    feature_importance JSONB,
    training_samples INTEGER,
    test_samples INTEGER,
    roc_auc FLOAT,
    cross_validation_scores JSONB,
    training_time_ms INTEGER,
    model_size_mb FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PostgreSQL indexes for behavior_model_metrics
CREATE INDEX IF NOT EXISTS idx_behavior_model_version ON behavior_model_metrics (model_version);
CREATE INDEX IF NOT EXISTS idx_behavior_model_created_at ON behavior_model_metrics (created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_model_accuracy ON behavior_model_metrics (accuracy);
CREATE INDEX IF NOT EXISTS idx_behavior_model_metrics_gin ON behavior_model_metrics USING GIN (feature_importance);

-- Session-level aggregation view
CREATE OR REPLACE VIEW behavior_session_summary AS
SELECT 
    session_id,
    COUNT(*) as snapshot_count,
    MIN(captured_at) as session_start,
    MAX(captured_at) as session_end,
    EXTRACT(EPOCH FROM (MAX(captured_at) - MIN(captured_at))) as session_duration_seconds,
    AVG((features->>'mouseMoveCount')::FLOAT) as avg_mouse_moves,
    AVG((features->>'keyPressCount')::FLOAT) as avg_key_presses,
    AVG((features->>'timeOnPageSeconds')::FLOAT) as avg_time_on_page,
    AVG((features->>'interactionScore')::FLOAT) as avg_interaction_score,
    AVG((features->>'idleRatio')::FLOAT) as avg_idle_ratio,
    MAX(label) as final_label, -- Use the most confident label
    MAX(label_source) as label_source,
    COUNT(CASE WHEN label = 1 THEN 1 END) as human_predictions,
    COUNT(CASE WHEN label = 0 THEN 1 END) as bot_predictions
FROM behavior_metrics
GROUP BY session_id;

-- Data quality constraints
ALTER TABLE behavior_metrics 
ADD CONSTRAINT chk_label_range CHECK (label IN (0, 1, NULL)),
ADD CONSTRAINT chk_time_on_page_positive CHECK ((features->>'timeOnPageSeconds')::FLOAT >= 0),
ADD CONSTRAINT chk_mouse_moves_positive CHECK ((features->>'mouseMoveCount')::FLOAT >= 0),
ADD CONSTRAINT chk_key_presses_positive CHECK ((features->>'keyPressCount')::FLOAT >= 0);

ALTER TABLE behavior_failed_attempts
ADD CONSTRAINT chk_captured_at_not_future CHECK (captured_at <= NOW());

-- Function to clean up old data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_behavior_data()
RETURNS void AS $$
BEGIN
    -- Delete behavior metrics older than 90 days
    DELETE FROM behavior_metrics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete failed attempts older than 30 days
    DELETE FROM behavior_failed_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep model metrics for 1 year
    DELETE FROM behavior_model_metrics 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-behavior-data', '0 2 * * *', 'SELECT cleanup_old_behavior_data();');

-- Row Level Security (RLS) policies
ALTER TABLE behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_model_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow service role to access behavior data
CREATE POLICY "Service role full access to behavior_metrics" ON behavior_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to behavior_failed_attempts" ON behavior_failed_attempts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to behavior_model_metrics" ON behavior_model_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE behavior_metrics IS 'Stores behavioral feature snapshots for ML training and analysis';
COMMENT ON TABLE behavior_failed_attempts IS 'Logs failed authentication attempts for security analysis';
COMMENT ON TABLE behavior_model_metrics IS 'Tracks model performance metrics over time';

COMMENT ON COLUMN behavior_metrics.features IS 'JSON object containing behavioral features like mouseMoveCount, keyPressCount, etc.';
COMMENT ON COLUMN behavior_metrics.label IS 'Classification label: 0=bot, 1=human, NULL=unlabeled';
COMMENT ON COLUMN behavior_failed_attempts.reason IS 'Human-readable reason why the attempt was flagged as bot';
