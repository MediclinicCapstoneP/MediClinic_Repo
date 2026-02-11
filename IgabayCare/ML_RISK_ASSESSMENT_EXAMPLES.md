# ML Risk Assessment System - Examples and Documentation

## Overview

The ML risk assessment system evaluates clinic registration metadata to determine risk levels and assign appropriate account capabilities without using patient data or clinical information.

## System Integration Point

The ML hook is placed immediately AFTER clinic creation in the registration flow:

```
1. User submits clinic registration form
2. Basic validation and user account creation
3. Clinic record created with basic info
4. ⭐ ML RISK ASSESSMENT HOOK ⭐
5. Risk assessment results stored in clinic record
6. Account capabilities assigned based on risk level
7. User shown assessment results and next steps
```

## Example Input/Output

### Example 1: Low Risk Clinic

**Input JSON (Clinic Registration Data):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "clinic_name": "Metro Medical Center",
  "email": "contact@metromedical.com",
  "phone": "+1-555-0123-4567",
  "website": "https://www.metromedical.com",
  "address": "123 Healthcare Ave",
  "city": "Manila",
  "state": "Metro Manila",
  "zip_code": "1000",
  "license_number": "PHL-123456789",
  "accreditation": "PhilHealth Accredited",
  "tax_id": "123-456-789-000",
  "year_established": 2010,
  "specialties": ["Internal Medicine", "Pediatrics", "Family Medicine"],
  "custom_specialties": [],
  "services": ["General Consultation", "Vaccination", "Physical Therapy"],
  "custom_services": [],
  "operating_hours": {
    "monday": { "open": "08:00", "close": "18:00" },
    "tuesday": { "open": "08:00", "close": "18:00" },
    "wednesday": { "open": "08:00", "close": "18:00" },
    "thursday": { "open": "08:00", "close": "18:00" },
    "friday": { "open": "08:00", "close": "18:00" },
    "saturday": { "open": "09:00", "close": "16:00" },
    "sunday": { "open": "10:00", "close": "14:00" }
  },
  "number_of_doctors": 8,
  "number_of_staff": 15,
  "description": "Metro Medical Center is a comprehensive healthcare facility providing quality medical services to the community. Our team of experienced physicians and healthcare professionals are dedicated to patient care and wellness.",
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

**Output JSON (Risk Assessment Result):**
```json
{
  "risk_score": 0.25,
  "risk_level": "LOW",
  "account_status": "ACTIVE_LIMITED",
  "risk_flags": [],
  "assessment_reason": "Risk assessment completed with LOW risk level (score: 0.25). Positive indicators: valid medical license, professional accreditation, established business history, verified location.",
  "feature_vector": {
    "clinic_name_length": 19,
    "has_website": true,
    "website_domain_age": 8,
    "has_phone": true,
    "phone_format_valid": true,
    "has_complete_address": true,
    "address_completeness_score": 1.0,
    "has_coordinates": true,
    "has_license_number": true,
    "license_format_valid": true,
    "license_length": 12,
    "has_accreditation": true,
    "has_tax_id": true,
    "tax_id_format_valid": true,
    "year_established": 2010,
    "years_in_business": 14,
    "is_new_business": false,
    "is_established_business": true,
    "number_of_doctors": 8,
    "number_of_staff": 15,
    "doctor_to_staff_ratio": 1.875,
    "is_solo_practice": false,
    "is_large_clinic": false,
    "specialties_count": 3,
    "services_count": 3,
    "has_custom_specialties": false,
    "has_custom_services": false,
    "specialty_diversity_score": 0.6,
    "has_operating_hours": true,
    "hours_coverage_score": 0.8,
    "has_weekend_hours": true,
    "has_extended_hours": false,
    "submission_time_hour": 14,
    "is_business_hours_submission": true,
    "submission_day_of_week": 2,
    "is_weekday_submission": true,
    "description_length": 189,
    "has_description": true,
    "description_quality_score": 0.8
  }
}
```

### Example 2: High Risk Clinic

**Input JSON (Clinic Registration Data):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "clinic_name": "QC",
  "email": "quick.clinic@email.com",
  "phone": "123",
  "website": "",
  "address": "",
  "city": "",
  "state": "",
  "zip_code": "",
  "license_number": "",
  "accreditation": "",
  "tax_id": "",
  "year_established": 2024,
  "specialties": [],
  "custom_specialties": ["Alternative Healing"],
  "services": [],
  "custom_services": ["Wellness Consultation"],
  "operating_hours": {},
  "number_of_doctors": 1,
  "number_of_staff": 0,
  "description": "Clinic",
  "latitude": null,
  "longitude": null
}
```

**Output JSON (Risk Assessment Result):**
```json
{
  "risk_score": 0.85,
  "risk_level": "HIGH",
  "account_status": "RESTRICTED",
  "risk_flags": [
    "NO_WEBSITE",
    "INVALID_PHONE_FORMAT",
    "NO_LICENSE_NUMBER",
    "NO_ACCREDITATION",
    "INCOMPLETE_ADDRESS",
    "NO_LOCATION_VERIFICATION",
    "NEW_BUSINESS",
    "SOLO_PRACTICE",
    "NO_SPECIALTIES",
    "SHORT_CLINIC_NAME",
    "POOR_DESCRIPTION_QUALITY"
  ],
  "assessment_reason": "Risk assessment completed with HIGH risk level (score: 0.85). Areas of concern: missing license information, newly established business, incomplete address information, invalid phone format.",
  "feature_vector": {
    "clinic_name_length": 2,
    "has_website": false,
    "website_domain_age": null,
    "has_phone": true,
    "phone_format_valid": false,
    "has_complete_address": false,
    "address_completeness_score": 0.0,
    "has_coordinates": false,
    "has_license_number": false,
    "license_format_valid": false,
    "license_length": 0,
    "has_accreditation": false,
    "has_tax_id": false,
    "tax_id_format_valid": false,
    "year_established": 2024,
    "years_in_business": 0,
    "is_new_business": true,
    "is_established_business": false,
    "number_of_doctors": 1,
    "number_of_staff": 0,
    "doctor_to_staff_ratio": 0.0,
    "is_solo_practice": true,
    "is_large_clinic": false,
    "specialties_count": 1,
    "services_count": 1,
    "has_custom_specialties": true,
    "has_custom_services": true,
    "specialty_diversity_score": 0.4,
    "has_operating_hours": false,
    "hours_coverage_score": 0.0,
    "has_weekend_hours": false,
    "has_extended_hours": false,
    "submission_time_hour": 23,
    "is_business_hours_submission": false,
    "submission_day_of_week": 6,
    "is_weekday_submission": false,
    "description_length": 6,
    "has_description": true,
    "description_quality_score": 0.1
  }
}
```

## Account Status Capabilities

### ACTIVE_LIMITED
- ✅ Can accept appointments (max 10 per day)
- ✅ Can edit profile
- ✅ Can add doctors
- ✅ Visible in public search
- ✅ Can set pricing
- ⚠️ Limited promotional features
- ⚠️ No access to advanced analytics

### VERIFICATION_REQUIRED
- ✅ Can edit profile (limited)
- ❌ Cannot accept appointments
- ❌ Not visible in public search
- ❌ Cannot add doctors or staff
- ❌ Cannot set pricing

### RESTRICTED
- ❌ All functionality restricted
- ❌ Manual review required
- ❌ Contact support for assistance

## Risk Thresholds

```typescript
{
  low_risk_max: 0.3,      // 0.0 - 0.3 = LOW
  medium_risk_max: 0.7,   // 0.3 - 0.7 = MEDIUM  
  high_risk_min: 0.7      // 0.7 - 1.0 = HIGH
}
```

## Feature Categories

### Business Legitimacy Features
- Website presence and domain age
- Phone format validation
- License number format validation
- Accreditation status
- Tax ID format validation

### Business Maturity Features
- Years in business
- New business vs established business

### Scale and Structure Features
- Number of doctors and staff
- Solo practice vs large clinic
- Doctor-to-staff ratio

### Completeness Features
- Address completeness score
- Clinic name length
- Required fields presence

### Service Diversity Features
- Number of specialties and services
- Custom vs standard specialties
- Specialty diversity score

### Operating Pattern Features
- Operating hours coverage
- Weekend and extended hours
- Submission time patterns

### Text Quality Features
- Description length and quality
- Medical terminology usage

## Compliance Notes (HIPAA/HIPPA-Aligned)

### ✅ Compliant Aspects
1. **No Patient Data**: System only uses administrative and business metadata
2. **No Clinical Information**: No medical records, diagnoses, or treatment data
3. **No Government APIs**: No external registry or government database integration
4. **Metadata Only**: Uses only business registration information provided by the clinic
5. **Audit Trail**: All assessments are logged for compliance and review
6. **Transparent**: Assessment reasons and flags are clearly communicated

### 🔒 Data Protection
1. **Feature Vector Storage**: Raw features are stored securely in audit logs
2. **No Personal Health Information**: No PHI is processed or stored
3. **Business Data Only**: Only business registration metadata is analyzed
4. **Secure Processing**: All processing happens within the secure system boundary

### 📋 Regulatory Compliance
1. **Administrative Review**: ML assists but doesn't replace administrative oversight
2. **Appeal Process**: Clinics can request manual review of assessments
3. **Documentation**: Complete audit trail of all assessments and decisions
4. **Model Transparency**: Interpretable features and clear decision logic
5. **Non-Deterministic**: No clinical decisions or patient care impacts

## Integration Code Example

```typescript
// In clinic registration flow
import { EnhancedClinicService } from '../services/enhancedClinicService';

const handleClinicRegistration = async (clinicData: EnhancedClinicData) => {
  try {
    // Step 1: Create clinic with ML risk assessment
    const result = await EnhancedClinicService.createClinicWithRiskAssessment(clinicData);
    
    if (result.success) {
      // Step 2: Show risk assessment results to user
      showRiskAssessmentResults(result.riskAssessment, result.cinic);
      
      // Step 3: Redirect based on account status
      if (result.clinic.account_status === 'ACTIVE_LIMITED') {
        navigate('/clinic/dashboard');
      } else {
        navigate('/clinic/verification-required');
      }
    } else {
      showError(result.error);
    }
  } catch (error) {
    handleRegistrationError(error);
  }
};
```

## Model Versioning

- **Current Version**: 1.0
- **Update Process**: New versions are deployed with backward compatibility
- **Audit Trail**: Each assessment logs the model version used
- **Rollback Capability**: Previous versions can be restored if needed

## Monitoring and Analytics

The system tracks:
- Risk score distributions
- Account status changes over time
- Feature importance analysis
- Assessment accuracy metrics
- User feedback and appeals

This ensures the ML model remains fair, accurate, and aligned with business requirements.
