# Medical History Functionality - Step-by-Step Guide

## 📋 Overview

The Medical History functionality in IgabayCare provides a comprehensive view of all patient medical records, including appointments, consultations, prescriptions, lab results, vaccinations, allergies, insurance, and emergency contacts. This document explains how it works step by step.

---

## 🔄 Complete Workflow

### **Phase 1: Medical Record Creation**

#### Step 1.1: Record Creation Triggers

Medical records can be created in several scenarios:

**A. During Consultation (Doctor Completes Appointment)**
```typescript
// Location: src/services/consultationHistoryService.ts
// Method: updateConsultationRecord()

1. Doctor completes consultation in DoctorAppointments.tsx
2. Doctor fills in:
   - Diagnosis
   - Treatment plan
   - Doctor notes
   - Vital signs (optional)
   - Follow-up information

3. System calls ConsultationHistoryService.updateConsultationRecord()
```

**B. Prescription Creation**
```typescript
// Location: src/pages/doctor/DoctorAppointments.tsx
// After prescription is created:

1. Doctor creates prescription for patient
2. System automatically creates medical record with:
   - record_type: 'prescription'
   - title: "Prescription - X medication(s)"
   - diagnosis, treatment, prescription details
   - Links to appointment_id
```

**C. Manual Record Creation**
```typescript
// Location: src/services/doctorPatientRecordsService.ts
// Method: createMedicalRecord()

Doctor can manually create records for:
- Lab results
- Vaccinations
- Surgeries
- Imaging results
- Other medical events
```

#### Step 1.2: Database Storage

```sql
-- Table: medical_records
INSERT INTO medical_records (
  id,                          -- UUID (auto-generated)
  patient_id,                  -- Links to patient
  doctor_id,                   -- Links to doctor (optional)
  clinic_id,                   -- Links to clinic
  appointment_id,              -- Links to appointment (optional)
  record_type,                 -- consultation|lab_result|prescription|vaccination|surgery|imaging|other
  title,                       -- Required: Brief description
  description,                 -- Optional: Full description
  diagnosis,                   -- Optional: Medical diagnosis
  treatment,                   -- Optional: Treatment plan
  prescription,                -- Optional: Prescription details
  lab_results,                 -- Optional: JSONB for structured lab data
  vital_signs,                 -- Optional: JSONB for vital signs
  attachments,                 -- Optional: Array of file URLs
  is_private,                  -- Boolean: Privacy flag (default: false)
  visit_date,                  -- Date of visit (default: CURRENT_DATE)
  chief_complaint,             -- Optional: Patient's complaint
  created_at,                  -- Timestamp
  updated_at                   -- Timestamp
)
```

---

### **Phase 2: Data Retrieval**

#### Step 2.1: User Accesses History Page

```typescript
// Location: src/pages/patient/PatientHistory.tsx

1. Patient navigates to "Patient History" or "Medical History"
2. Component mounts: PatientHistory component
3. patientId is passed as prop (from authenticated user)
```

#### Step 2.2: Load Comprehensive History

```typescript
// Location: src/pages/patient/PatientHistory.tsx
// Method: loadComprehensiveMedicalHistory()

// Step 2.2.1: Build Filters (if any)
const filters: EnhancedHistoryFilters = {
  status: filterStatus,           // 'all' | 'completed' | 'scheduled' | etc.
  dateRange: {                    // Optional date range
    start: filterFrom,
    end: filterTo
  }
}

// Step 2.2.2: Call Service
const result = await EnhancedHistoryService.getPatientHistory(patientId, filters);
```

#### Step 2.3: Service Layer Processing

```typescript
// Location: src/services/enhancedHistoryService.ts
// Method: getPatientHistory()

1. Fetch Appointments
   ├─ Query: appointments table
   ├─ Join: clinics, doctors
   ├─ Filter: patient_id, date range, status
   └─ Order: appointment_date DESC

2. Fetch Medical Records (IN PARALLEL)
   ├─ Query: medical_records table
   ├─ Join: doctors, clinics, appointments
   ├─ Filter: patient_id, is_private = false, date range
   └─ Order: visit_date DESC, created_at DESC

3. Fetch Prescriptions (IN PARALLEL)
   ├─ Query: prescriptions table
   ├─ Join: prescription_medications
   └─ Filter: patient_id

4. Fetch Lab Results (IN PARALLEL)
   ├─ Query: lab_results table
   └─ Filter: patient_id

5. Fetch Vaccinations (IN PARALLEL)
   ├─ Query: vaccination_records table
   └─ Filter: patient_id

6. Fetch Allergies (IN PARALLEL)
   ├─ Query: allergies table
   └─ Filter: patient_id

7. Fetch Insurance Info (IN PARALLEL)
   ├─ Query: insurance_info table
   └─ Filter: patient_id

8. Fetch Emergency Contacts (IN PARALLEL)
   ├─ Query: emergency_contacts table
   └─ Filter: patient_id
```

#### Step 2.4: Alternative Service (Fallback)

```typescript
// Location: src/services/medicalHistoryService.ts
// Method: getPatientMedicalHistory()

If EnhancedHistoryService fails, system falls back to:
- MedicalHistoryService.getPatientMedicalHistory()
- Same parallel fetching strategy
- Uses safeQuery() wrapper for error handling
```

#### Step 2.5: Data Aggregation

```typescript
// All parallel queries complete
// Service aggregates results:

const medicalHistory: PatientMedicalHistory = {
  patient_id: patientId,
  appointments: [...],           // Array of AppointmentWithDetails
  medical_records: [...],        // Array of MedicalRecordWithDetails
  prescriptions: [...],          // Array of PrescriptionWithDetails
  lab_results: [...],            // Array of LabResultWithDetails
  vaccinations: [...],           // Array of VaccinationWithDetails
  allergies: [...],              // Array of Allergy
  insurance_info: [...],         // Array of InsuranceInfo
  emergency_contacts: [...],     // Array of EmergencyContact
  summary: {...}                 // HistorySummary object
}

// Generate Summary Statistics
summary = {
  total_appointments: number,
  completed_appointments: number,
  upcoming_appointments: number,
  cancelled_appointments: number,
  total_prescriptions: number,
  active_prescriptions: number,
  total_lab_results: number,
  pending_lab_results: number,
  total_vaccinations: number,
  total_allergies: number,
  active_allergies: number,
  last_visit_date: string,
  next_appointment_date: string,
  chronic_conditions: string[],
  current_medications: string[]
}
```

---

### **Phase 3: Data Display**

#### Step 3.1: View Selection

```typescript
// Location: src/pages/patient/PatientHistory.tsx

User can choose between 3 views:
1. Overview (Dashboard)
2. Timeline (Chronological)
3. Appointments (Table view)
```

#### Step 3.2: Overview View (Dashboard)

```typescript
// Component: MedicalHistoryDashboard.tsx

1. Display Summary Cards:
   ├─ Total Appointments
   ├─ Medical Records Count
   ├─ Prescriptions (Active/Total)
   ├─ Lab Results (Pending/Total)
   ├─ Vaccinations
   └─ Allergies (Active/Total)

2. Display Chronic Conditions:
   ├─ Extract from medical_records with "chronic" in diagnosis
   └─ Show as list

3. Display Current Medications:
   ├─ Extract from prescriptions with status='active'
   └─ Show as list

4. Display Health Status Indicators:
   ├─ Active allergies warning
   ├─ Pending lab results
   └─ Upcoming appointments
```

#### Step 3.3: Timeline View

```typescript
// Component: MedicalHistoryTimeline.tsx
// Service: EnhancedHistoryService.generateHistoryTimeline()

// Step 3.3.1: Generate Timeline Items
const timelineItems = generateHistoryTimeline(medicalHistory);

Process:
1. Convert Appointments → HistoryTimelineItem[]
   ├─ id: "appointment-{id}"
   ├─ type: 'appointments'
   ├─ date: appointment_date
   ├─ title: "Appointment - {type}"
   └─ description: status + doctor/clinic info

2. Convert Medical Records → HistoryTimelineItem[]
   ├─ id: "record-{id}"
   ├─ type: 'medical_records'
   ├─ date: visit_date || created_at
   ├─ title: record.title || "Medical Record - {record_type}"
   └─ description: description || diagnosis || chief_complaint

3. Convert Prescriptions → HistoryTimelineItem[]
   ├─ id: "prescription-{id}"
   ├─ type: 'prescriptions'
   ├─ date: prescribed_date
   ├─ title: "Prescription - {medication_name}"
   └─ description: dosage + frequency

4. Convert Lab Results → HistoryTimelineItem[]
5. Convert Vaccinations → HistoryTimelineItem[]

6. Sort all items by date (most recent first)
```

#### Step 3.4: Timeline Filtering & Search

```typescript
// Component: MedicalHistoryTimeline.tsx

User can filter by:

1. Search Term:
   ├─ Searches: title, description, doctor_name, clinic_name
   └─ Case-insensitive

2. Record Types:
   ├─ Filter: appointments, medical_records, prescriptions, lab_results, vaccinations
   └─ Multi-select checkboxes

3. Date Range:
   ├─ From Date: Filter items after this date
   └─ To Date: Filter items before this date

4. Combined Filtering:
   All filters work together (AND logic)
```

#### Step 3.5: Timeline Item Display

```typescript
For each timeline item:

1. Display Header:
   ├─ Icon (based on record type)
   ├─ Record type badge
   ├─ Status badge (if applicable)
   ├─ Priority badge (if urgent)
   ├─ Title
   └─ Description

2. Display Metadata:
   ├─ Date (formatted)
   ├─ Doctor name (if available)
   └─ Clinic name (if available)

3. Expandable Details:
   └─ Click to expand → Shows full record details
```

#### Step 3.6: Expanded Record Details

```typescript
// Different details shown based on record type:

Medical Records:
├─ Record Type
├─ Description
├─ Chief Complaint
├─ Diagnosis
├─ Treatment
├─ Prescription (if applicable)
├─ Lab Results (JSON formatted)
├─ Vital Signs (JSON formatted)
└─ Attachments (file list)

Prescriptions:
├─ Dosage
├─ Frequency
├─ Duration
└─ Instructions

Lab Results:
├─ Test Type
├─ Results (formatted)
├─ Interpretation
└─ Doctor Notes

Vaccinations:
├─ Vaccine Type
├─ Site of Injection
├─ Dose Number
└─ Next Dose Date
```

#### Step 3.7: Appointments Table View

```typescript
// Traditional table view for appointments only

Columns:
├─ Clinic Name & Location
├─ Date & Time
├─ Type
├─ Doctor Name & Specialty
├─ Status Badge
├─ Priority Badge
└─ Prescriptions Count

Features:
├─ Sortable columns
├─ Filter by status, date range
├─ Search by clinic name
└─ Prescription count badge (for completed appointments)
```

---

### **Phase 4: Data Relationships**

#### Step 4.1: Foreign Key Relationships

```sql
medical_records
├─ patient_id → patients(id) [CASCADE DELETE]
├─ doctor_id → doctors(id)
├─ clinic_id → clinics(id)
└─ appointment_id → appointments(id) [SET NULL ON DELETE]

This ensures:
- Deleting patient deletes all their records
- Deleting appointment keeps record but removes link
- Records can exist without appointments (standalone records)
```

#### Step 4.2: Data Enrichment

```typescript
// When fetching records, system joins related data:

MedicalRecordWithDetails = MedicalRecord + {
  doctor: {
    id: string,
    full_name: string,
    specialization: string
  },
  clinic: {
    id: string,
    clinic_name: string
  },
  appointment: {
    id: string,
    appointment_date: string,
    appointment_time: string
  }
}
```

---

### **Phase 5: Privacy & Security**

#### Step 5.1: Privacy Filtering

```typescript
// All queries filter out private records by default:
.is('is_private', false)

This means:
- Only non-private records are shown to patients
- Private records are only accessible by doctors/clinics with proper permissions
- Ensures sensitive information protection
```

#### Step 5.2: Row Level Security (RLS)

```sql
-- Supabase RLS policies ensure:
1. Patients can only see their own records
2. Doctors can see records for their patients
3. Clinics can see records for their patients
4. Admins have appropriate access
```

---

## 🔍 Key Service Methods

### MedicalHistoryService Methods:

1. **getPatientMedicalHistory(patientId, filters?)**
   - Main method for comprehensive history
   - Fetches all record types in parallel
   - Returns aggregated PatientMedicalHistory object

2. **getMedicalRecords(patientId, filters?)**
   - Fetches only medical_records
   - Handles errors gracefully with safeQuery()
   - Returns MedicalRecordWithDetails[]

3. **getAppointmentHistory(patientId, filters?)**
   - Fetches appointments with clinic/doctor info
   - Returns AppointmentWithDetails[]

4. **generateHistoryTimeline(history, filters?)**
   - Converts all records to timeline items
   - Sorts chronologically
   - Returns HistoryTimelineItem[]

5. **generateHistorySummary(...)**
   - Calculates statistics
   - Extracts chronic conditions
   - Identifies current medications
   - Returns HistorySummary

---

## 📊 Data Flow Diagram

```
User Action
    ↓
PatientHistory Component
    ↓
loadComprehensiveMedicalHistory()
    ↓
EnhancedHistoryService.getPatientHistory()
    ↓
┌─────────────────────────────────────────┐
│  Parallel Data Fetching (Promise.all)  │
│  ├─ Appointments                        │
│  ├─ Medical Records                     │
│  ├─ Prescriptions                       │
│  ├─ Lab Results                         │
│  ├─ Vaccinations                        │
│  ├─ Allergies                           │
│  ├─ Insurance                           │
│  └─ Emergency Contacts                  │
└─────────────────────────────────────────┘
    ↓
Data Aggregation
    ↓
Generate Summary Statistics
    ↓
Create PatientMedicalHistory Object
    ↓
┌─────────────────────────────────────────┐
│  View Rendering                         │
│  ├─ Overview (Dashboard)                │
│  ├─ Timeline (Chronological)            │
│  └─ Appointments (Table)                │
└─────────────────────────────────────────┘
    ↓
User Interaction
├─ Filter by date/type/status
├─ Search records
├─ Expand details
└─ View full record
```

---

## 🎯 Common Use Cases

### Use Case 1: Patient Views Medical History
1. Patient logs in → Navigates to "Patient History"
2. System loads all medical data in parallel
3. Patient sees overview dashboard with summary
4. Patient switches to timeline view
5. Patient filters by "prescriptions" and date range
6. Patient expands a prescription record to see details

### Use Case 2: Doctor Completes Consultation
1. Doctor completes appointment in DoctorAppointments
2. Doctor enters diagnosis, treatment, notes
3. System creates medical record automatically
4. Record is linked to appointment, patient, doctor, clinic
5. Patient can now see this record in their history

### Use Case 3: Patient Searches for Past Consultation
1. Patient goes to timeline view
2. Patient types "chest pain" in search
3. System filters timeline items matching search term
4. Patient finds relevant consultation record
5. Patient expands to see full details

---

## 🔧 Technical Details

### Error Handling
- Uses `safeQuery()` wrapper to handle missing tables gracefully
- Falls back to EnhancedHistoryService if primary service fails
- Continues with available data even if some queries fail
- Logs errors but doesn't break user experience

### Performance Optimizations
- Parallel fetching with `Promise.all()` for speed
- Indexes on `patient_id`, `doctor_id`, `clinic_id` in database
- Filters applied at database level (not client-side)
- Lazy loading for timeline items

### Data Structure
- All records follow consistent structure
- JSONB fields for flexible data (lab_results, vital_signs)
- Array fields for multiple values (attachments)
- Type-safe TypeScript interfaces throughout

---

## 📝 Summary

The Medical History functionality provides a comprehensive, unified view of all patient medical information. It:

1. **Creates records** automatically during consultations and prescriptions
2. **Stores** records in the medical_records table with proper relationships
3. **Retrieves** all records in parallel for performance
4. **Displays** records in multiple views (dashboard, timeline, table)
5. **Filters** and searches across all record types
6. **Protects** sensitive data with privacy flags and RLS

The system is designed to be fast, secure, and user-friendly, providing patients and healthcare providers with easy access to complete medical history.

---

## 👨‍⚕️ Doctor Side Functionality - Step-by-Step Guide for Mobile

This section provides a complete guide for mobile app developers implementing doctor-side medical record functionality.

---

## 📱 Doctor Workflow Overview

Doctors can:
1. **View Patient Medical History** - See all records for their patients
2. **Create Medical Records** - During consultations or manually
3. **Update Consultation Records** - Add diagnosis, treatment, notes after appointment
4. **Create Prescriptions** - Issue prescriptions (auto-creates medical record)
5. **View Patient List** - See all patients assigned to them

---

## 🗄️ Database Tables Used

### **Primary Table: `medical_records`**

```sql
-- Main table for all medical records
CREATE TABLE medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id),
  clinic_id uuid REFERENCES clinics(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Required fields
  record_type text NOT NULL CHECK (
    record_type IN ('consultation', 'lab_result', 'prescription', 
                    'vaccination', 'surgery', 'imaging', 'other')
  ),
  title text NOT NULL,
  
  -- Optional medical fields
  description text,
  diagnosis text,
  treatment text,
  prescription text,
  chief_complaint text,
  visit_date date DEFAULT CURRENT_DATE,
  
  -- JSONB fields for structured data
  lab_results jsonb,
  vital_signs jsonb,
  
  -- Array field for file attachments
  attachments text[],
  
  -- Privacy and metadata
  is_private boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);
```

### **Related Tables:**

1. **`appointments`** - Links to appointment records
2. **`patients`** - Patient information
3. **`doctors`** - Doctor information
4. **`clinics`** - Clinic information
5. **`prescriptions`** - Separate prescription table (also creates medical_record)

---

## 🔄 Step-by-Step: Doctor Functionality

### **Functionality 1: View Patient Medical History**

#### Step 1.1: Get Doctor's Patient List

**Table:** `patients` (filtered by doctor's appointments)

**API Endpoint (Mobile):**
```typescript
// Service: DoctorPatientRecordsService.getDoctorPatients()
// Method: GET /api/doctors/{doctorId}/patients

// Query:
SELECT 
  p.*,
  COUNT(DISTINCT a.id) as total_appointments,
  MAX(a.appointment_date) as last_appointment_date
FROM patients p
INNER JOIN appointments a ON a.patient_id = p.id
WHERE a.doctor_id = {doctorId}
GROUP BY p.id
ORDER BY last_appointment_date DESC;
```

**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+63...",
      "total_appointments": 5,
      "last_appointment_date": "2024-01-15"
    }
  ]
}
```

#### Step 1.2: Get Patient's Medical History

**Table:** `medical_records` + related tables

**API Endpoint (Mobile):**
```typescript
// Service: DoctorPatientRecordsService.getPatientMedicalHistory()
// Method: GET /api/doctors/{doctorId}/patients/{patientId}/history

// Implementation:
1. Call MedicalHistoryService.getPatientMedicalHistory(patientId)
2. Filter results to only include records where doctor_id = {doctorId}
3. Return filtered history
```

**Query Flow:**
```sql
-- 1. Get medical records for this patient and doctor
SELECT mr.*,
       d.full_name as doctor_name,
       d.specialization,
       c.clinic_name,
       a.appointment_date,
       a.appointment_time
FROM medical_records mr
LEFT JOIN doctors d ON mr.doctor_id = d.id
LEFT JOIN clinics c ON mr.clinic_id = c.id
LEFT JOIN appointments a ON mr.appointment_id = a.id
WHERE mr.patient_id = {patientId}
  AND mr.doctor_id = {doctorId}  -- Filter by doctor
ORDER BY mr.visit_date DESC, mr.created_at DESC;

-- 2. Get appointments (filtered by doctor)
SELECT a.*,
       c.clinic_name,
       d.full_name as doctor_name
FROM appointments a
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.patient_id = {patientId}
  AND a.doctor_id = {doctorId}
ORDER BY a.appointment_date DESC;

-- 3. Get prescriptions (filtered by doctor)
SELECT p.*
FROM prescriptions p
WHERE p.patient_id = {patientId}
  AND p.doctor_id = {doctorId}
ORDER BY p.prescribed_date DESC;
```

**Response:**
```json
{
  "success": true,
  "history": {
    "appointments": [...],
    "medical_records": [...],
    "prescriptions": [...],
    "lab_results": [...],
    "vaccinations": [...],
    "allergies": [...]
  }
}
```

---

### **Functionality 2: Create Medical Record (During Consultation)**

#### Step 2.1: Complete Appointment Consultation

**Table:** `appointments` (update) + `medical_records` (create/update)

**API Endpoint (Mobile):**
```typescript
// Service: ConsultationHistoryService.updateConsultationRecord()
// Method: POST /api/appointments/{appointmentId}/consultation

// Request Body:
{
  "diagnosis": "Upper respiratory infection",
  "treatment_plan": "Rest, hydration, antibiotics",
  "doctor_notes": "Patient shows signs of recovery",
  "vital_signs": {
    "blood_pressure_systolic": 120,
    "blood_pressure_diastolic": 80,
    "heart_rate": 72,
    "temperature": 98.6,
    "weight": 70,
    "height": 170
  },
  "follow_up_required": true,
  "follow_up_date": "2024-02-01"
}
```

#### Step 2.2: Database Operations

**Step 2.2.1: Update Appointment**
```sql
-- Table: appointments
UPDATE appointments
SET 
  doctor_notes = {doctor_notes},
  updated_at = NOW()
WHERE id = {appointmentId};
```

**Step 2.2.2: Get Appointment Details**
```sql
-- Table: appointments
SELECT 
  patient_id,
  clinic_id,
  doctor_id,
  appointment_date
FROM appointments
WHERE id = {appointmentId}
LIMIT 1;
```

**Step 2.2.3: Check if Record Exists**
```sql
-- Table: medical_records
SELECT id
FROM medical_records
WHERE appointment_id = {appointmentId}
LIMIT 1;
```

**Step 2.2.4: Create or Update Medical Record**

**If record exists (UPDATE):**
```sql
-- Table: medical_records
UPDATE medical_records
SET 
  record_type = 'consultation',
  title = 'Consultation - {diagnosis (first 50 chars)}',
  description = {doctor_notes},
  diagnosis = {diagnosis},
  treatment = {treatment_plan},
  vital_signs = {vital_signs}::jsonb,
  visit_date = {appointment_date},
  updated_at = NOW()
WHERE id = {existing_record_id};
```

**If record doesn't exist (INSERT):**
```sql
-- Table: medical_records
INSERT INTO medical_records (
  patient_id,
  doctor_id,
  clinic_id,
  appointment_id,
  record_type,
  title,
  description,
  diagnosis,
  treatment,
  vital_signs,
  visit_date,
  is_private,
  created_at,
  updated_at
) VALUES (
  {patient_id},
  {doctor_id},
  {clinic_id},
  {appointment_id},
  'consultation',
  'Consultation - {diagnosis (first 50 chars)}',
  {doctor_notes},
  {diagnosis},
  {treatment_plan},
  {vital_signs}::jsonb,
  {appointment_date},
  false,
  NOW(),
  NOW()
)
RETURNING *;
```

**Response:**
```json
{
  "success": true
}
```

---

### **Functionality 3: Create Medical Record (Manual)**

#### Step 3.1: Doctor Creates Standalone Record

**Table:** `medical_records` (insert)

**API Endpoint (Mobile):**
```typescript
// Service: DoctorPatientRecordsService.createMedicalRecord()
// Method: POST /api/doctors/{doctorId}/patients/{patientId}/records

// Request Body:
{
  "record_type": "lab_result",  // consultation|lab_result|prescription|vaccination|surgery|imaging|other
  "title": "Blood Test Results - Complete Blood Count",
  "description": "Routine CBC test results",
  "visit_date": "2024-01-15",
  "chief_complaint": "Routine checkup",
  "diagnosis": "Normal CBC values",
  "treatment": "Continue current medications",
  "lab_results": {
    "hemoglobin": 14.5,
    "white_blood_cells": 7000,
    "platelets": 250000,
    "units": {
      "hemoglobin": "g/dL",
      "white_blood_cells": "cells/μL",
      "platelets": "cells/μL"
    }
  },
  "vital_signs": {
    "blood_pressure_systolic": 120,
    "blood_pressure_diastolic": 80
  },
  "attachments": ["https://storage.url/lab-report.pdf"],
  "is_private": false,
  "appointment_id": null,  // Optional: link to appointment
  "clinic_id": "{clinic_id}"  // Optional: link to clinic
}
```

#### Step 3.2: Database Insert

```sql
-- Table: medical_records
INSERT INTO medical_records (
  patient_id,
  doctor_id,
  clinic_id,
  appointment_id,
  record_type,
  title,
  description,
  visit_date,
  chief_complaint,
  diagnosis,
  treatment,
  lab_results,
  vital_signs,
  attachments,
  is_private,
  created_at,
  updated_at
) VALUES (
  {patient_id},
  {doctor_id},
  {clinic_id},
  {appointment_id},  -- Can be NULL for standalone records
  {record_type},
  {title},
  {description},
  {visit_date}::date,
  {chief_complaint},
  {diagnosis},
  {treatment},
  {lab_results}::jsonb,
  {vital_signs}::jsonb,
  {attachments}::text[],
  {is_private},
  NOW(),
  NOW()
)
RETURNING *;
```

**Response:**
```json
{
  "success": true,
  "record": {
    "id": "uuid",
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "record_type": "lab_result",
    "title": "Blood Test Results - Complete Blood Count",
    ...
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### **Functionality 4: Create Prescription (Auto-creates Medical Record)**

#### Step 4.1: Doctor Creates Prescription

**Tables:** `prescriptions` (insert) + `medical_records` (insert)

**API Endpoint (Mobile):**
```typescript
// Service: PrescriptionService (creates prescription)
// Then: Auto-creates medical record
// Method: POST /api/appointments/{appointmentId}/prescriptions

// Request Body:
{
  "diagnosis": "Hypertension",
  "medications": [
    {
      "medication_name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take with food"
    }
  ],
  "general_instructions": "Monitor blood pressure weekly"
}
```

#### Step 4.2: Database Operations

**Step 4.2.1: Create Prescription**
```sql
-- Table: prescriptions
INSERT INTO prescriptions (
  patient_id,
  doctor_id,
  clinic_id,
  appointment_id,
  medication_name,
  dosage,
  frequency,
  duration,
  instructions,
  prescribed_date,
  status,
  created_at
) VALUES (
  {patient_id},
  {doctor_id},
  {clinic_id},
  {appointment_id},
  {medication_name},
  {dosage},
  {frequency},
  {duration},
  {instructions},
  CURRENT_DATE,
  'active',
  NOW()
)
RETURNING *;
```

**Step 4.2.2: Auto-create Medical Record**
```sql
-- Table: medical_records
INSERT INTO medical_records (
  patient_id,
  doctor_id,
  clinic_id,
  appointment_id,
  record_type,
  title,
  description,
  visit_date,
  chief_complaint,
  diagnosis,
  treatment,
  prescription,
  is_private,
  created_at,
  updated_at
) VALUES (
  {patient_id},
  {doctor_id},
  {clinic_id},
  {appointment_id},
  'prescription',
  'Prescription - {medication_count} medication(s)',
  'Prescription issued with {medication_count} medication(s). {general_instructions}',
  CURRENT_DATE,
  {consultation_notes} || 'Prescription issued',
  {diagnosis} || 'Prescription medications prescribed',
  {medication_list},  -- Formatted: "Med1 - dose, freq; Med2 - dose, freq"
  {medication_list},  -- Same as treatment
  false,
  NOW(),
  NOW()
)
RETURNING *;
```

**Response:**
```json
{
  "success": true,
  "prescription": {
    "id": "uuid",
    "medication_name": "Lisinopril",
    ...
  }
}
```

---

## 📊 Mobile API Endpoints Summary

### **1. Get Doctor's Patients**
```
GET /api/doctors/{doctorId}/patients
Query Params: ?search=&bloodType=&hasAllergies=
Response: { success: boolean, patients: PatientRecord[] }
Table: patients (joined with appointments)
```

### **2. Get Patient Medical History**
```
GET /api/doctors/{doctorId}/patients/{patientId}/history
Query Params: ?dateFrom=&dateTo=&recordType=
Response: { success: boolean, history: PatientMedicalHistory }
Tables: medical_records, appointments, prescriptions, lab_results, vaccinations
```

### **3. Update Consultation Record**
```
POST /api/appointments/{appointmentId}/consultation
Body: { diagnosis, treatment_plan, doctor_notes, vital_signs, follow_up_required, follow_up_date }
Response: { success: boolean }
Tables: appointments (update), medical_records (create/update)
```

### **4. Create Medical Record**
```
POST /api/doctors/{doctorId}/patients/{patientId}/records
Body: { record_type, title, description, diagnosis, treatment, lab_results, vital_signs, ... }
Response: { success: boolean, record: MedicalRecord }
Table: medical_records (insert)
```

### **5. Create Prescription**
```
POST /api/appointments/{appointmentId}/prescriptions
Body: { diagnosis, medications[], general_instructions }
Response: { success: boolean, prescription: Prescription }
Tables: prescriptions (insert), medical_records (auto-insert)
```

---

## 🔐 Security & Permissions

### **Row Level Security (RLS) Policies**

```sql
-- Doctors can only see their own records
CREATE POLICY "doctors_view_own_records" ON medical_records
  FOR SELECT
  USING (
    doctor_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = medical_records.doctor_id 
      AND user_id = auth.uid()
    )
  );

-- Doctors can create records for their patients
CREATE POLICY "doctors_create_records" ON medical_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = medical_records.doctor_id 
      AND user_id = auth.uid()
    )
  );

-- Doctors can update their own records
CREATE POLICY "doctors_update_own_records" ON medical_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE id = medical_records.doctor_id 
      AND user_id = auth.uid()
    )
  );
```

### **Mobile App Security Checklist**

1. ✅ Verify doctor authentication before API calls
2. ✅ Include `doctor_id` in all requests (from authenticated user)
3. ✅ Validate `patient_id` belongs to doctor's patients
4. ✅ Check appointment belongs to doctor before updating
5. ✅ Validate required fields (record_type, title) before insert
6. ✅ Sanitize user input (especially JSONB fields)
7. ✅ Handle errors gracefully (network, validation, permissions)

---

## 📝 Required Fields by Record Type

### **Consultation Record:**
- ✅ `record_type`: 'consultation'
- ✅ `title`: Required
- ✅ `patient_id`: Required
- ✅ `doctor_id`: Required
- ✅ `clinic_id`: Recommended
- ✅ `appointment_id`: Recommended (if linked to appointment)
- ⚪ `diagnosis`: Optional
- ⚪ `treatment`: Optional
- ⚪ `vital_signs`: Optional (JSONB)
- ⚪ `description`: Optional

### **Lab Result Record:**
- ✅ `record_type`: 'lab_result'
- ✅ `title`: Required
- ✅ `patient_id`: Required
- ✅ `doctor_id`: Required
- ⚪ `lab_results`: Optional (JSONB) - Recommended
- ⚪ `diagnosis`: Optional

### **Prescription Record:**
- ✅ `record_type`: 'prescription'
- ✅ `title`: Required
- ✅ `patient_id`: Required
- ✅ `doctor_id`: Required
- ⚪ `prescription`: Optional (text description)
- ⚪ `treatment`: Optional (medication list)

### **Vaccination Record:**
- ✅ `record_type`: 'vaccination'
- ✅ `title`: Required
- ✅ `patient_id`: Required
- ✅ `doctor_id`: Required
- ⚪ `description`: Optional (vaccine details)

---

## 🎯 Mobile Implementation Checklist

### **View Patient History:**
- [ ] Implement GET `/api/doctors/{doctorId}/patients` endpoint
- [ ] Display patient list with last appointment date
- [ ] Implement GET `/api/doctors/{doctorId}/patients/{patientId}/history` endpoint
- [ ] Display medical history timeline
- [ ] Filter by record type and date range
- [ ] Show record details on tap/click

### **Create Consultation Record:**
- [ ] Implement POST `/api/appointments/{appointmentId}/consultation` endpoint
- [ ] Form fields: diagnosis, treatment_plan, doctor_notes, vital_signs
- [ ] Validate required fields
- [ ] Handle create/update logic (check if record exists)
- [ ] Show success/error feedback

### **Create Medical Record:**
- [ ] Implement POST `/api/doctors/{doctorId}/patients/{patientId}/records` endpoint
- [ ] Form with record type selector
- [ ] Dynamic fields based on record type
- [ ] JSONB field handling (lab_results, vital_signs)
- [ ] File attachment support (attachments array)
- [ ] Privacy toggle (is_private)

### **Create Prescription:**
- [ ] Implement POST `/api/appointments/{appointmentId}/prescriptions` endpoint
- [ ] Medication list builder
- [ ] Auto-create medical record after prescription
- [ ] Show prescription in patient history

### **Error Handling:**
- [ ] Network error handling
- [ ] Validation error display
- [ ] Permission error handling
- [ ] Retry logic for failed requests
- [ ] Offline mode support (queue requests)

---

## 🔄 Data Flow for Mobile

```
Mobile App
    ↓
User Action (Doctor)
    ↓
API Request
├─ Authentication (Bearer token)
├─ doctor_id (from token)
└─ Request body/data
    ↓
Supabase API
    ↓
RLS Policy Check
├─ Verify doctor_id matches authenticated user
└─ Verify patient belongs to doctor
    ↓
Database Operation
├─ INSERT (create record)
├─ UPDATE (update record)
└─ SELECT (fetch records)
    ↓
Response
├─ Success: { success: true, data: {...} }
└─ Error: { success: false, error: "message" }
    ↓
Mobile App
├─ Update UI
├─ Show success message
└─ Refresh data if needed
```

---

## 💡 Best Practices for Mobile

1. **Caching**: Cache patient list and history for offline access
2. **Pagination**: Implement pagination for large patient lists
3. **Search**: Add search functionality for patient names
4. **Validation**: Validate all inputs before API calls
5. **Loading States**: Show loading indicators during API calls
6. **Error Messages**: Display user-friendly error messages
7. **Data Sync**: Sync local changes when connection restored
8. **Image Handling**: Compress images before uploading attachments
9. **JSONB Handling**: Validate JSON structure before sending
10. **Date Formatting**: Use ISO 8601 format for all dates

---

This guide provides everything mobile developers need to implement doctor-side medical record functionality in the IgabayCare mobile app.

