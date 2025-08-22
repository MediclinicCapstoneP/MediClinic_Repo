# Prescription System Setup Guide

## Overview
This guide explains how to set up the prescription system that allows doctors to create and manage prescriptions for their patients through the doctor dashboard.

## Prerequisites
- Supabase project with authentication enabled
- Existing doctors and patients tables
- Doctor authentication system working

## Database Setup

### 1. Create the Prescriptions Table

The prescriptions table should already exist from the `missing_tables.sql` file. If not, run this SQL:

```sql
-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id),
    clinic_id UUID REFERENCES public.clinics(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    prescribed_date DATE NOT NULL,
    expiry_date DATE,
    refills_remaining INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create Indexes for Performance

```sql
-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
```

### 3. Enable Row Level Security

```sql
-- Enable Row Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS Policies

```sql
-- Allow doctors to manage prescriptions for their patients
CREATE POLICY "Doctors can manage prescriptions" ON prescriptions
    FOR ALL USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- Allow patients to view their own prescriptions
CREATE POLICY "Patients can view their prescriptions" ON prescriptions
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Allow clinic owners to view prescriptions from their clinic
CREATE POLICY "Clinic owners can view prescriptions" ON prescriptions
    FOR SELECT USING (
        clinic_id IN (
            SELECT id FROM clinics WHERE user_id = auth.uid()
        )
    );
```

### 5. Create Helper Functions

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prescriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_prescriptions_updated_at();
```

## Features Implemented

### **Doctor Dashboard Prescription Management:**
✅ **Create Prescriptions** - Doctors can add multiple medications per prescription
✅ **Comprehensive Medication Details** - Name, dosage, frequency, duration, instructions, refills
✅ **Patient Association** - Prescriptions are linked to specific patients
✅ **Status Tracking** - Active, completed, cancelled, expired statuses
✅ **Real-time Updates** - Prescriptions are saved to database and displayed immediately

### **Prescription Form Fields:**
✅ **Medication Name** - Name of the prescribed medication
✅ **Dosage** - Amount and form (e.g., "500mg", "10mg tablet")
✅ **Frequency** - How often to take (e.g., "Twice daily", "As needed")
✅ **Duration** - How long to take (e.g., "7 days", "Until finished")
✅ **Instructions** - Special instructions (e.g., "Take with meals", "Avoid alcohol")
✅ **Refills Remaining** - Number of refills allowed

### **Database Integration:**
✅ **Real Database Storage** - Prescriptions saved to Supabase database
✅ **Patient Relationships** - Linked to patient records
✅ **Doctor Relationships** - Linked to prescribing doctor
✅ **Clinic Relationships** - Linked to clinic for organization
✅ **Audit Trail** - Created and updated timestamps

## How It Works

### **For Doctors:**
1. **Log in** to doctor dashboard
2. **Go to Appointments tab** and find a patient appointment
3. **Click "Make Prescription"** button
4. **Fill in medication details**:
   - Medication name and dosage
   - Frequency and duration
   - Instructions and refills
5. **Add multiple medications** if needed
6. **Click "Confirm Prescription"** to save
7. **View prescriptions** in the Prescriptions tab

### **For Patients:**
1. **Prescriptions are stored** in the database
2. **Can be viewed** by patients through their dashboard
3. **Status tracking** shows active vs completed prescriptions
4. **Refill information** shows remaining refills

### **For Clinics:**
1. **View all prescriptions** from their doctors
2. **Track medication patterns** across patients
3. **Monitor prescription status** and compliance

## Security Features

- **Row Level Security** - Doctors can only access their own prescriptions
- **Patient Privacy** - Patients can only see their own prescriptions
- **Clinic Isolation** - Clinics can only see prescriptions from their doctors
- **Data Validation** - Required fields and proper data types
- **Audit Trail** - All changes tracked with timestamps

## Files Modified

- `src/features/auth/utils/prescriptionService.ts` - New prescription service
- `src/pages/doctor/DoctorDashboard.tsx` - Updated to use real prescription data
- `database/missing_tables.sql` - Contains prescriptions table schema
- `database/PRESCRIPTION_SYSTEM_SETUP.md` - This setup guide

## Testing

### **Test the Complete Flow:**

1. **Create a doctor account** and log in
2. **Create a patient account** or use existing patient
3. **Create an appointment** between doctor and patient
4. **Log in as doctor** and go to appointments
5. **Click "Make Prescription"** for the appointment
6. **Add medication details** and save
7. **Verify prescription appears** in prescriptions tab
8. **Check database** to confirm prescription was saved

### **Test Multiple Medications:**

1. **Add multiple medications** to a single prescription
2. **Verify all medications** are saved correctly
3. **Check that each medication** has its own record in database

### **Test Prescription Status:**

1. **Create active prescriptions**
2. **Update status** to completed/cancelled
3. **Verify status changes** are reflected in UI

## Troubleshooting

### **Common Issues:**

1. **"Prescription not saved" error**
   - Check RLS policies are correctly configured
   - Verify doctor has proper permissions
   - Check database connection

2. **"Patient not found" error**
   - Ensure patient exists in patients table
   - Verify patient_id is correct
   - Check patient-doctor relationship

3. **"Permission denied" error**
   - Verify doctor is authenticated
   - Check RLS policies
   - Ensure doctor has clinic_id set

4. **"Invalid data" error**
   - Check required fields are filled
   - Verify data types are correct
   - Check for special characters in text fields

## Next Steps

After completing this setup:

1. **Test the prescription flow** thoroughly
2. **Add prescription notifications** for patients
3. **Implement prescription refill requests**
4. **Add prescription history** for patients
5. **Create prescription reports** for clinics
6. **Add medication interaction warnings**
7. **Implement prescription expiry notifications**

The prescription system is now ready for doctors to create and manage patient prescriptions! 🎉 