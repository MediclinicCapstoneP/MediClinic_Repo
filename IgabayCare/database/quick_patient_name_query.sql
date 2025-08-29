-- SIMPLE QUERY: Get Patient Name for Appointment c97d7adb-3b0d-4c13-ae5e-0c820a56550a

-- Basic query to get patient name
SELECT 
    a.id as appointment_id,
    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    a.appointment_date,
    a.appointment_time,
    a.appointment_type,
    a.status,
    a.doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';

-- Alternative: Get patient info separately
SELECT 
    id,
    first_name,
    last_name,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    phone
FROM patients 
WHERE id = (
    SELECT patient_id 
    FROM appointments 
    WHERE id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a'
);

-- Get the specific patient_id for reference
SELECT 
    id as appointment_id,
    patient_id,
    doctor_name,
    appointment_date,
    appointment_time,
    appointment_type,
    status
FROM appointments 
WHERE id = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';