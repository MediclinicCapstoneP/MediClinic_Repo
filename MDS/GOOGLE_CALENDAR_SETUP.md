# Google Calendar API Setup Guide

This guide will help you set up Google Calendar integration for your IgabayCare medical clinic application, which will allow your n8n chatbot to access appointment data.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Calendar where you want the appointments to be created
3. Basic understanding of Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "IgabayCare-Calendar")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "Service account"
3. Enter details:
   - Service account name: `igabaycare-calendar-service`
   - Service account ID: (auto-generated)
   - Description: `Service account for IgabayCare appointment calendar sync`
4. Click "Create and Continue"
5. Grant roles (optional for basic usage, but recommended):
   - Select "Editor" or create a custom role with Calendar access
6. Click "Continue" → "Done"

## Step 4: Generate Service Account Key

1. In "Credentials", find your service account
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. **Save the downloaded JSON file securely** - you'll need it for the next step

## Step 5: Share Your Google Calendar with the Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Find the calendar you want to use (or create a new one)
3. Click the three dots next to the calendar name → "Settings and sharing"
4. Scroll to "Share with specific people"
5. Click "Add people"
6. Enter the service account email (found in your JSON file as `client_email`)
7. Set permission to "Make changes to events"
8. Click "Send"

## Step 6: Configure Environment Variables

Open your `.env` file and update the Google Calendar variables using the values from your downloaded JSON file:

```env
# Google Calendar API Configuration
VITE_GOOGLE_PROJECT_ID=your_project_id_from_json
VITE_GOOGLE_PRIVATE_KEY_ID=private_key_id_from_json
VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_from_json\n-----END PRIVATE KEY-----"
VITE_GOOGLE_CLIENT_EMAIL=client_email_from_json
VITE_GOOGLE_CLIENT_ID=client_id_from_json
VITE_GOOGLE_CLIENT_CERT_URL=client_x509_cert_url_from_json
```

**Important Notes:**
- The private key should include the full content with `\n` for line breaks
- Keep the quotes around the private key
- Replace all the `your_*_from_json` placeholders with actual values

## Step 7: Update Database Schema

Run the SQL script in `database_updates.sql` in your Supabase SQL editor:

```sql
-- Add Google Calendar event ID column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_google_calendar_event_id 
ON appointments (google_calendar_event_id);
```

## Step 8: Test the Integration

1. Start your development server: `npm run dev`
2. Try booking an appointment through your application
3. Check your Google Calendar to see if the appointment appears
4. Look at the browser console for any error messages

## Step 9: Configure for n8n Integration

Your Google Calendar is now accessible via the Google Calendar API. For your n8n chatbot to access this data:

### Option A: Use Google Calendar Trigger in n8n
1. In n8n, add a "Google Calendar Trigger" node
2. Configure it with the same service account credentials
3. Set it to trigger on new events in your calendar

### Option B: Use Google Calendar Node for Queries
1. Add a "Google Calendar" node in your n8n workflow
2. Set operation to "Get All" or "Get" events
3. Use filters like:
   - Calendar ID: `primary` (or your specific calendar ID)
   - Query: `IgabayCare` (to filter only clinic appointments)
   - Time range: as needed for your chatbot

### Option C: Use HTTP Request to Google Calendar API
1. Add an "HTTP Request" node
2. URL: `https://www.googleapis.com/calendar/v3/calendars/primary/events`
3. Authentication: Use OAuth2 with your service account
4. Query parameters:
   - `q=IgabayCare` (filter for clinic appointments)
   - `timeMin` and `timeMax` for date ranges
   - `orderBy=startTime&singleEvents=true`

## Troubleshooting

### Common Issues:

1. **"Service account key is invalid"**
   - Check that all environment variables are correctly set
   - Verify the private key format (should include BEGIN/END markers)

2. **"Calendar not found" or permission errors**
   - Ensure the calendar is shared with the service account email
   - Check that the service account has "Make changes to events" permission

3. **"API not enabled"**
   - Verify Google Calendar API is enabled in Google Cloud Console
   - Wait a few minutes after enabling as it may take time to propagate

4. **Events not appearing in calendar**
   - Check the console logs for API errors
   - Verify the calendar ID (use 'primary' for the main calendar)
   - Ensure the service account has write permissions

### Debug Steps:

1. Check browser console for error messages
2. Verify environment variables are loaded correctly
3. Test API connection with a simple calendar read operation
4. Check Google Cloud Console API usage logs

## Security Considerations

1. **Never commit your service account JSON file to version control**
2. Store service account credentials securely
3. Use environment variables for all sensitive data
4. Rotate service account keys periodically
5. Limit calendar sharing to only necessary permissions

## Benefits for n8n Integration

With this setup, your n8n chatbot can:

1. **Read appointment data** from Google Calendar
2. **Get real-time updates** when appointments are booked/modified
3. **Access structured appointment information** including:
   - Patient name and contact info
   - Appointment type/service
   - Date and time
   - Doctor information
   - Custom metadata (clinic source, appointment type, etc.)

The appointments will appear in Google Calendar with consistent formatting and metadata that n8n can easily parse and use for automated workflows.
