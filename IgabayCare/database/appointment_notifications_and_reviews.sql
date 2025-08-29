-- APPOINTMENT COMPLETION NOTIFICATIONS AND REVIEWS SYSTEM
-- This script creates the database tables and functions needed for:
-- 1. Notifying patients when their appointments are completed
-- 2. Allowing patients to rate and review clinics/doctors after completed appointments

-- ===================================================================
-- 1. NOTIFICATIONS TABLE
-- ===================================================================

-- Enhanced notifications table for appointment completion and other notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE, -- Link to specific appointment
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'appointment_completed', 
        'appointment_reminder', 
        'appointment_confirmed', 
        'appointment_cancelled',
        'review_request',
        'system', 
        'medical', 
        'security'
    )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- URL for action buttons (e.g., rate appointment)
    action_text TEXT, -- Text for action button (e.g., "Rate Your Visit")
    metadata JSONB, -- Additional data for notifications
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. REVIEWS/RATINGS TABLE
-- ===================================================================

-- Reviews table for patient feedback on clinics and doctors
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id), -- Optional if appointment had specific doctor
    
    -- Rating scores (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Written review
    review_title TEXT,
    review_text TEXT,
    
    -- Review metadata
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true, -- Verified because tied to actual appointment
    is_published BOOLEAN DEFAULT true,
    
    -- Helpful votes (future feature)
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    -- Response from clinic (future feature)
    clinic_response TEXT,
    clinic_response_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per appointment
    UNIQUE(appointment_id, patient_id)
);

-- ===================================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- ===================================================================

-- User preferences for different types of notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email notifications
    email_appointment_completed BOOLEAN DEFAULT true,
    email_appointment_reminder BOOLEAN DEFAULT true,
    email_appointment_confirmed BOOLEAN DEFAULT true,
    email_review_request BOOLEAN DEFAULT true,
    
    -- Push notifications (web/mobile)
    push_appointment_completed BOOLEAN DEFAULT true,
    push_appointment_reminder BOOLEAN DEFAULT true,
    push_appointment_confirmed BOOLEAN DEFAULT true,
    push_review_request BOOLEAN DEFAULT true,
    
    -- SMS notifications (future feature)
    sms_appointment_completed BOOLEAN DEFAULT false,
    sms_appointment_reminder BOOLEAN DEFAULT false,
    sms_appointment_confirmed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 4. REVIEW AGGREGATION VIEW
-- ===================================================================

-- View for clinic/doctor rating summaries
CREATE OR REPLACE VIEW clinic_ratings AS
SELECT 
    c.id as clinic_id,
    c.clinic_name,
    COUNT(r.id) as total_reviews,
    ROUND(AVG(r.overall_rating)::numeric, 2) as average_rating,
    ROUND(AVG(r.staff_rating)::numeric, 2) as average_staff_rating,
    ROUND(AVG(r.cleanliness_rating)::numeric, 2) as average_cleanliness_rating,
    ROUND(AVG(r.communication_rating)::numeric, 2) as average_communication_rating,
    ROUND(AVG(r.value_rating)::numeric, 2) as average_value_rating,
    COUNT(CASE WHEN r.overall_rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN r.overall_rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN r.overall_rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN r.overall_rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN r.overall_rating = 1 THEN 1 END) as one_star_count,
    MAX(r.created_at) as latest_review_date
FROM clinics c
LEFT JOIN reviews r ON c.id = r.clinic_id AND r.is_published = true
GROUP BY c.id, c.clinic_name;

-- ===================================================================
-- 5. FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- ===================================================================

-- Function to create appointment completion notification
CREATE OR REPLACE FUNCTION create_appointment_completion_notification(
    p_appointment_id UUID,
    p_patient_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    clinic_name TEXT;
    appointment_date DATE;
BEGIN
    -- Get clinic name and appointment date
    SELECT c.clinic_name, a.appointment_date 
    INTO clinic_name, appointment_date
    FROM appointments a 
    JOIN clinics c ON a.clinic_id = c.id 
    WHERE a.id = p_appointment_id;
    
    -- Create the notification
    INSERT INTO notifications (
        user_id,
        appointment_id,
        title,
        message,
        type,
        priority,
        action_url,
        action_text,
        metadata
    ) VALUES (
        p_patient_user_id,
        p_appointment_id,
        'Appointment Completed',
        'Your appointment at ' || clinic_name || ' on ' || appointment_date || ' has been completed. How was your experience?',
        'appointment_completed',
        'normal',
        '/patient/appointments?review=' || p_appointment_id,
        'Rate Your Visit',
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'clinic_name', clinic_name,
            'appointment_date', appointment_date
        )
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically trigger notification when appointment status changes to completed
CREATE OR REPLACE FUNCTION trigger_appointment_completion_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_user_id UUID;
BEGIN
    -- Only trigger if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get patient's user_id
        SELECT p.user_id INTO patient_user_id
        FROM patients p
        WHERE p.id = NEW.patient_id;
        
        -- Create notification
        PERFORM create_appointment_completion_notification(NEW.id, patient_user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ===================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id ON reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(clinic_id) WHERE is_published = true;

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ===================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view published reviews" ON reviews
    FOR SELECT USING (is_published = true);

CREATE POLICY "Patients can create reviews for their appointments" ON reviews
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can update their own reviews" ON reviews
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- ===================================================================
-- 8. TRIGGERS
-- ===================================================================

-- Create trigger for appointment completion notifications
CREATE TRIGGER appointment_completion_trigger
    AFTER UPDATE OF status ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_appointment_completion_notification();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 9. SAMPLE DATA AND VERIFICATION
-- ===================================================================

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ===================================================================
-- 10. GRANTS AND PERMISSIONS
-- ===================================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT ON clinic_ratings TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if tables were created successfully
SELECT 'notifications' as table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
UNION ALL
SELECT 'reviews' as table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
UNION ALL
SELECT 'notification_preferences' as table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' AND table_schema = 'public';

-- Success message
SELECT '✅ Appointment notifications and reviews system created successfully!' as status;