# Appointments Table Setup

This document describes the comprehensive appointments table setup for the IgabayCare application.

## Table Structure

The appointments table is designed to handle all appointment-related data with proper relationships, constraints, and security policies.

### Key Features

- **Comprehensive Data Model**: Supports all types of medical appointments
- **Conflict Prevention**: Built-in triggers to prevent double-booking
- **Security**: Row Level Security (RLS) policies for data protection
- **Flexibility**: Supports various appointment types, statuses, and priorities
- **Audit Trail**: Tracks creation, updates, and cancellations
- **Insurance Support**: Includes insurance and billing information
- **Reminder System**: Built-in support for appointment reminders

## Database Schema

### Main Table: `appointments`

```sql
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Patient and Clinic relationships
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Doctor information
    doctor_id UUID, -- Future reference to doctors table
    doctor_name TEXT,
    doctor_specialty TEXT,
    
    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Appointment type and status
    appointment_type TEXT NOT NULL DEFAULT 'consultation',
    status TEXT NOT NULL DEFAULT 'scheduled',
    priority TEXT DEFAULT 'normal',
    
    -- Location information
    room_number TEXT,
    floor_number TEXT,
    building TEXT,
    
    -- Notes
    patient_notes TEXT,
    doctor_notes TEXT,
    admin_notes TEXT,
    
    -- Insurance and billing
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    copay_amount DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Reminders and notifications
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Appointment Types

The system supports various appointment types:

- `consultation` - General consultation
- `follow_up` - Follow-up appointment
- `emergency` - Emergency visit
- `routine_checkup` - Routine health check
- `specialist_visit` - Specialist consultation
- `procedure` - Medical procedure
- `surgery` - Surgical procedure
- `lab_test` - Laboratory tests
- `imaging` - Imaging studies
- `vaccination` - Vaccination
- `physical_therapy` - Physical therapy
- `mental_health` - Mental health session
- `dental` - Dental appointment
- `vision` - Vision/eye care
- `other` - Other appointment types

## Appointment Statuses

- `scheduled` - Appointment is scheduled
- `confirmed` - Appointment is confirmed
- `in_progress` - Appointment is currently happening
- `completed` - Appointment is completed
- `cancelled` - Appointment is cancelled
- `no_show` - Patient didn't show up
- `rescheduled` - Appointment was rescheduled

## Priority Levels

- `low` - Low priority
- `normal` - Normal priority
- `high` - High priority
- `urgent` - Urgent priority

## Security Features

### Row Level Security (RLS)

The table has comprehensive RLS policies:

1. **Patients can view their own appointments**
2. **Clinics can view appointments for their clinic**
3. **Patients can create appointments for themselves**
4. **Clinics can create appointments for their clinic**
5. **Patients can update their own appointments**
6. **Clinics can update appointments for their clinic**
7. **Patients can delete their own appointments** (if not confirmed/completed)
8. **Clinics can delete appointments for their clinic**

### Data Validation

- **Time Constraints**: Appointments can only be scheduled between 8 AM and 6 PM
- **Date Constraints**: Appointments cannot be scheduled in the past
- **Conflict Prevention**: Built-in triggers prevent double-booking

## Setup Instructions

### 1. Run the SQL Script

Execute the `create_appointments_table.sql` file in your Supabase SQL editor:

```sql
-- Run the complete appointments table setup
\i database/create_appointments_table.sql
```

### 2. Verify the Setup

Check that the table and policies are created correctly:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'appointments';
```

### 3. Test the Setup

Create a test appointment to verify everything works:

```sql
-- Insert a test appointment (replace with actual patient_id and clinic_id)
INSERT INTO appointments (
    patient_id,
    clinic_id,
    doctor_name,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    priority,
    patient_notes
) VALUES (
    'your-patient-id',
    'your-clinic-id',
    'Dr. Test',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    'consultation',
    'scheduled',
    'normal',
    'Test appointment'
);
```

## TypeScript Integration

The appointments table is fully integrated with TypeScript:

### Types and Interfaces

- `Appointment` - Main appointment interface
- `CreateAppointmentData` - For creating new appointments
- `UpdateAppointmentData` - For updating existing appointments
- `AppointmentFilters` - For filtering appointments
- `AppointmentWithDetails` - Appointment with related data

### Service Class

The `AppointmentService` class provides:

- CRUD operations
- Filtering and searching
- Statistics calculation
- Time slot availability checking
- Conflict prevention

## Usage Examples

### Creating an Appointment

```typescript
import { AppointmentService } from './appointmentService';

const newAppointment = await AppointmentService.createAppointment({
  patient_id: 'patient-uuid',
  clinic_id: 'clinic-uuid',
  doctor_name: 'Dr. Smith',
  appointment_date: '2024-01-15',
  appointment_time: '09:00:00',
  appointment_type: 'consultation',
  patient_notes: 'Regular checkup'
});
```

### Getting Patient Appointments

```typescript
const patientAppointments = await AppointmentService.getAppointments({
  patient_id: 'patient-uuid',
  status: 'scheduled'
});
```

### Checking Time Slot Availability

```typescript
const isAvailable = await AppointmentService.isTimeSlotAvailable(
  'clinic-uuid',
  '2024-01-15',
  '09:00:00'
);
```

### Getting Available Time Slots

```typescript
const availableSlots = await AppointmentService.getAvailableTimeSlots(
  'clinic-uuid',
  '2024-01-15'
);
```

## Performance Considerations

### Indexes

The table includes optimized indexes for:

- `patient_id` - Fast patient appointment queries
- `clinic_id` - Fast clinic appointment queries
- `appointment_date` - Fast date-based queries
- `status` - Fast status filtering
- `appointment_type` - Fast type filtering
- Composite indexes for common query patterns

### Query Optimization

- Use specific filters to reduce result sets
- Leverage the built-in ordering for consistent results
- Use the statistics methods for dashboard data

## Maintenance

### Regular Tasks

1. **Clean up old appointments**: Archive or delete very old appointments
2. **Monitor performance**: Check query performance regularly
3. **Update statistics**: Ensure appointment statistics are accurate
4. **Backup data**: Regular backups of appointment data

### Troubleshooting

Common issues and solutions:

1. **Time slot conflicts**: Check the conflict prevention triggers
2. **Permission errors**: Verify RLS policies are correctly applied
3. **Performance issues**: Check if indexes are being used properly

## Future Enhancements

Potential improvements:

1. **Doctor table integration**: Full doctor management system
2. **Recurring appointments**: Support for recurring appointment series
3. **Waitlist functionality**: Handle appointment waitlists
4. **Advanced scheduling**: More sophisticated scheduling algorithms
5. **Integration with external calendars**: Sync with Google Calendar, Outlook, etc.

## Support

For issues or questions about the appointments table:

1. Check the error logs in Supabase
2. Verify RLS policies are correctly applied
3. Test with the provided TypeScript service
4. Review the conflict prevention triggers

The appointments table is designed to be robust, secure, and scalable for a healthcare application. 