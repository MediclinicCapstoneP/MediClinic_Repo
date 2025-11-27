-- Add Google Calendar event ID column to appointments table
-- Run this in your Supabase SQL editor or database management tool

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_google_calendar_event_id 
ON appointments (google_calendar_event_id);

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN appointments.google_calendar_event_id 
IS 'Google Calendar event ID for syncing appointments with Google Calendar for n8n integration';
