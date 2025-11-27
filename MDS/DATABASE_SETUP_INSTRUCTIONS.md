# Database Setup Instructions

## Missing clinic_services Table

The application is trying to access a `clinic_services` table that doesn't exist in your Supabase database. You need to run the SQL script to create this table.

## Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the SQL Script**
   - Open the file: `database/create_clinic_services_pricing.sql`
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute the script

3. **Verify Table Creation**
   - Go to Table Editor in Supabase
   - Confirm that `clinic_services` table now exists
   - Check that it has the following columns:
     - id, clinic_id, service_name, base_price, description, duration_minutes, service_category, is_available, created_at, updated_at

## What the Script Does:

- Creates the `clinic_services` table with proper structure
- Sets up Row Level Security (RLS) policies
- Inserts sample service data for existing approved clinics
- Creates indexes for better performance

## After Running the Script:

The patient home page should now display clinics properly with real service pricing data instead of falling back to mock data.

## Troubleshooting:

If you still see errors after running the script:
1. Check that your Supabase project has the correct permissions
2. Verify that the `clinic_profiles` table exists and has approved clinics
3. Check the browser console for any remaining errors
