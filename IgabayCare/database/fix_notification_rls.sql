-- Fix notification RLS issues by creating RPC functions that bypass RLS
-- This file should be run in the Supabase SQL Editor

-- 1. Create RPC function to create notifications (bypasses RLS)
CREATE OR REPLACE FUNCTION create_notification_bypass_rls(
    p_user_id UUID,
    p_appointment_id UUID DEFAULT NULL,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Validate notification type
    IF p_type NOT IN (
        'appointment_completed', 
        'appointment_reminder', 
        'appointment_confirmed', 
        'appointment_cancelled',
        'review_request',
        'system', 
        'medical', 
        'security'
    ) THEN
        RAISE EXCEPTION 'Invalid notification type: %', p_type;
    END IF;

    -- Insert notification
    INSERT INTO public.notifications (
        user_id,
        appointment_id,
        title,
        message,
        type,
        is_read
    ) VALUES (
        p_user_id,
        p_appointment_id,
        p_title,
        p_message,
        p_type,
        false
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification_bypass_rls TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_bypass_rls TO service_role;

-- 3. Create RPC function to mark notifications as read (bypasses RLS)
CREATE OR REPLACE FUNCTION mark_notification_as_read(
    p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
BEGIN
    -- Update notification
    UPDATE public.notifications 
    SET is_read = true 
    WHERE id = p_notification_id;

    -- Check if update was successful
    RETURN FOUND;
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO service_role;

-- 5. Create RPC function to mark all notifications as read for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update all unread notifications for the user
    UPDATE public.notifications 
    SET is_read = true 
    WHERE user_id = p_user_id AND is_read = false;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO service_role;

-- 7. Drop existing RLS policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- 8. Create new RLS policies that work correctly
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Note: We don't create an INSERT policy since we'll use the RPC function for inserts

-- 9. Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. Test the function (optional - can be commented out)
-- SELECT create_notification_bypass_rls(
--     'test-user-id'::UUID,
--     'test-appointment-id'::UUID,
--     'Test Notification',
--     'This is a test notification',
--     'system'
-- );
