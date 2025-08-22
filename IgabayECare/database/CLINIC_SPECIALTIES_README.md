# Clinic Specialties Table

## Overview

The `clinic_specialties` table is a separate table designed to store medical specialties for each clinic. This provides better data organization, flexibility, and performance compared to storing specialties as arrays in the main clinics table.

## Table Structure

```sql
CREATE TABLE "public"."clinic_specialties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "clinic_id" uuid NOT NULL REFERENCES "public"."clinics"("id") ON DELETE CASCADE,
    "specialty_name" text NOT NULL,
    "is_custom" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
```

## Fields

- **id**: Unique identifier for each specialty entry
- **clinic_id**: Foreign key reference to the clinics table
- **specialty_name**: Name of the medical specialty
- **is_custom**: Boolean flag indicating if this is a custom specialty (true) or standard specialty (false)
- **created_at**: Timestamp when the record was created
- **updated_at**: Timestamp when the record was last updated

## Indexes

- `clinic_specialties_clinic_id_idx`: Index on clinic_id for faster lookups
- `clinic_specialties_specialty_name_idx`: Index on specialty_name for searching
- `clinic_specialties_clinic_specialty_unique`: Unique constraint on (clinic_id, specialty_name) to prevent duplicates

## Row Level Security (RLS)

The table has RLS enabled with the following policies:

1. **clinic_specialties_clinic_owner_policy**: Allows clinic owners to manage their own specialties
2. **clinic_specialties_public_read_policy**: Allows public read access to approved clinics' specialties

## Standard Specialties

The table comes pre-populated with common medical specialties:

- Cardiology
- Dermatology
- Neurology
- Orthopedics
- Pediatrics
- Psychiatry
- Internal Medicine
- Family Medicine
- Emergency Medicine
- Surgery
- Obstetrics & Gynecology
- Ophthalmology
- ENT (Ear, Nose, Throat)
- Radiology
- Anesthesiology
- Pathology
- Oncology
- Endocrinology
- Gastroenterology
- Pulmonology
- Nephrology
- Rheumatology
- Infectious Disease
- Physical Medicine & Rehabilitation

## Usage Examples

### Get all specialties for a clinic
```sql
SELECT specialty_name, is_custom 
FROM clinic_specialties 
WHERE clinic_id = 'your-clinic-id' 
ORDER BY specialty_name;
```

### Get only standard specialties
```sql
SELECT specialty_name 
FROM clinic_specialties 
WHERE clinic_id = 'your-clinic-id' AND is_custom = false;
```

### Get only custom specialties
```sql
SELECT specialty_name 
FROM clinic_specialties 
WHERE clinic_id = 'your-clinic-id' AND is_custom = true;
```

### Add a new specialty to a clinic
```sql
INSERT INTO clinic_specialties (clinic_id, specialty_name, is_custom)
VALUES ('your-clinic-id', 'Sports Medicine', true);
```

### Remove a specialty from a clinic
```sql
DELETE FROM clinic_specialties 
WHERE clinic_id = 'your-clinic-id' AND specialty_name = 'Cardiology';
```

## Migration

The `migrate_clinic_specialties.sql` script handles:

1. Moving existing specialties from the clinics table to the new clinic_specialties table
2. Removing the specialties columns from the clinics table
3. Creating a backup of the original clinics table
4. Creating a backward compatibility view

## Backward Compatibility

A view called `clinics_with_specialties` is created to maintain backward compatibility. This view joins the clinics and clinic_specialties tables to provide the same interface as before:

```sql
SELECT * FROM clinics_with_specialties WHERE id = 'your-clinic-id';
```

This returns the clinic data with specialties and custom_specialties as arrays, just like the old structure.

## Benefits

1. **Better Performance**: No need to parse JSON arrays for specialty queries
2. **Flexibility**: Easy to add/remove individual specialties
3. **Data Integrity**: Foreign key constraints ensure data consistency
4. **Scalability**: Can handle unlimited specialties per clinic
5. **Searchability**: Can easily search across all clinics for specific specialties
6. **Analytics**: Better support for reporting and analytics on specialties

## Frontend Integration

The `clinicSpecialtyService.ts` provides a complete API for managing clinic specialties:

- `getSpecialtiesByClinicId()`: Get all specialties for a clinic
- `addSpecialtyToClinic()`: Add a single specialty
- `addSpecialtiesToClinic()`: Add multiple specialties
- `replaceClinicSpecialties()`: Replace all specialties for a clinic
- `removeSpecialtyFromClinic()`: Remove a specialty
- `getAllSpecialtyNames()`: Get all available standard specialty names

## Maintenance

- The `updated_at` field is automatically updated via a trigger
- Duplicate specialties are prevented by the unique constraint
- Cascading deletes ensure specialties are removed when a clinic is deleted 