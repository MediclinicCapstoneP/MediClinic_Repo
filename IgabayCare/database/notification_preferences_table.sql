-- ===================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ===================================================================
-- This script creates the notification_preferences table for user notification settings

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User reference
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification type (matches the types in the frontend)
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'appointment_booked',
        'appointment_confirmed', 
        'appointment_reminder',
        'appointment_completed',
        'follow_up_scheduled',
        'payment_confirmed',
        'payment_failed',
        'appointment_cancelled',
        'general'
    )),
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference per user per notification type
    UNIQUE(user_id, notification_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can create their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;

-- Insert default preferences for existing users (optional)
-- This will create default notification preferences for all existing users
-- INSERT INTO notification_preferences (user_id, notification_type, email_enabled, sms_enabled, push_enabled)
-- SELECT 
--     u.id as user_id,
--     unnest(ARRAY[
--         'appointment_booked',
--         'appointment_confirmed',
--         'appointment_reminder',
--         'appointment_completed',
--         'follow_up_scheduled',
--         'payment_confirmed',
--         'payment_failed',
--         'appointment_cancelled'
--     ]) as notification_type,
--     TRUE as email_enabled,
--     FALSE as sms_enabled,
--     TRUE as push_enabled
-- FROM auth.users u
-- WHERE u.id NOT IN (
--     SELECT DISTINCT user_id FROM notification_preferences
-- )
-- ON CONFLICT (user_id, notification_type) DO NOTHING;

SELECT '✅ Notification preferences table created successfully!' as status;
