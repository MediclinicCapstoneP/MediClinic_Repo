# Database Setup Instructions

## Supabase Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Variables
Create a `.env` file in your project root with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

### 4. Configure Authentication
1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL and redirect URLs
3. Set up email templates for confirmation emails

### 5. Enable Email Confirmation (Optional)
1. Go to Authentication > Settings
2. Enable "Enable email confirmations"
3. Customize email templates

## Database Tables

### Patients Table
- Stores patient profiles with medical information
- Linked to auth.users via user_id
- Includes personal info, medical history, and emergency contacts

### Clinics Table
- Stores clinic information and business details
- Linked to auth.users via user_id
- Includes specialties, services, operating hours, and documents

### Appointments Table
- Manages appointments between patients and clinics
- Links patients and clinics
- Tracks appointment status and notes

## Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Patients can only access their own data
- Clinics can only access their own data
- Appointments are properly secured

## API Endpoints
The application uses Supabase's auto-generated REST API:
- `GET /rest/v1/patients` - Get patient profiles
- `POST /rest/v1/patients` - Create patient profile
- `PUT /rest/v1/patients` - Update patient profile
- `DELETE /rest/v1/patients` - Delete patient profile

Similar endpoints exist for clinics and appointments.

## Testing the Setup
1. Run the application
2. Try to register a new patient account
3. Check the Supabase dashboard to see if the user and patient profile were created
4. Verify that the patient can sign in and access their profile 