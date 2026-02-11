import type { CreateClinicData } from '../features/auth/utils/clinicService';

// Risk assessment interfaces
export interface RiskAssessmentResult {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  account_status: 'ACTIVE_LIMITED' | 'RESTRICTED' | 'VERIFICATION_REQUIRED';
  risk_flags: string[];
  assessment_reason: string;
  feature_vector: Record<string, any>;
}

export interface ClinicFeatures {
  // Business information features
  clinic_name_length: number;
  has_website: boolean;
  website_domain_age?: number; // In years (simulated)
  has_phone: boolean;
  phone_format_valid: boolean;
  
  // Location features
  has_complete_address: boolean;
  address_completeness_score: number; // 0-1 based on fields filled
  has_coordinates: boolean;
  
  // License and accreditation features
  has_license_number: boolean;
  license_format_valid: boolean;
  license_length: number;
  has_accreditation: boolean;
  has_tax_id: boolean;
  tax_id_format_valid: boolean;
  
  // Business maturity features
  year_established: number;
  years_in_business: number; // Current year - year_established
  is_new_business: boolean; // Less than 1 year
  is_established_business: boolean; // More than 5 years
  
  // Scale features
  number_of_doctors: number;
  number_of_staff: number;
  doctor_to_staff_ratio: number;
  is_solo_practice: boolean; // 1 doctor, minimal staff
  is_large_clinic: boolean; // More than 10 doctors
  
  // Service features
  specialties_count: number;
  services_count: number;
  has_custom_specialties: boolean;
  has_custom_services: boolean;
  specialty_diversity_score: number; // Based on variety of specialties
  
  // Operating hours features
  has_operating_hours: boolean;
  hours_coverage_score: number; // 0-1 based on weekly hours
  has_weekend_hours: boolean;
  has_extended_hours: boolean; // Evenings after 6 PM
  
  // Submission pattern features
  submission_time_hour: number; // Hour of day when submitted
  is_business_hours_submission: boolean; // 9 AM - 5 PM
  submission_day_of_week: number; // 0-6 (Sunday-Saturday)
  is_weekday_submission: boolean;
  
  // Text analysis features
  description_length: number;
  has_description: boolean;
  description_quality_score: number; // 0-1 based on length and content
}

export interface RiskThresholds {
  low_risk_max: number;      // 0.0 - 0.3
  medium_risk_max: number;   // 0.3 - 0.7
  high_risk_min: number;     // 0.7 - 1.0
}

export class ClinicRiskAssessmentService {
  private static readonly MODEL_VERSION = '1.0';
  private static readonly RISK_THRESHOLDS: RiskThresholds = {
    low_risk_max: 0.3,
    medium_risk_max: 0.7,
    high_risk_min: 0.7
  };

  // Main risk assessment method
  static async assessClinicRisk(
    clinicData: CreateClinicData,
    submissionTimestamp?: Date
  ): Promise<RiskAssessmentResult> {
    const features = this.extractFeatures(clinicData, submissionTimestamp);
    const riskScore = this.calculateRiskScore(features);
    const riskLevel = this.determineRiskLevel(riskScore);
    const accountStatus = this.recommendAccountStatus(riskScore, riskLevel, features);
    const riskFlags = this.generateRiskFlags(features, riskScore);
    const assessmentReason = this.generateAssessmentReason(features, riskScore, riskLevel);

    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      account_status: accountStatus,
      risk_flags: riskFlags,
      assessment_reason: assessmentReason,
      feature_vector: features
    };
  }

  // Extract features from clinic data
  private static extractFeatures(
    clinicData: CreateClinicData,
    submissionTimestamp?: Date
  ): ClinicFeatures {
    const now = submissionTimestamp || new Date();
    const currentYear = now.getFullYear();

    // Business information features
    const clinicNameLength = clinicData.clinic_name?.length || 0;
    const hasWebsite = !!clinicData.website?.trim();
    const websiteDomainAge = this.simulateDomainAge(clinicData.website);
    const hasPhone = !!clinicData.phone?.trim();
    const phoneFormatValid = this.validatePhoneFormat(clinicData.phone);

    // Location features
    const hasCompleteAddress = !!(
      clinicData.address?.trim() &&
      clinicData.city?.trim() &&
      clinicData.state?.trim() &&
      clinicData.zip_code?.trim()
    );
    const addressFields = [
      clinicData.address,
      clinicData.city,
      clinicData.state,
      clinicData.zip_code
    ].filter(field => field?.trim()).length;
    const addressCompletenessScore = addressFields / 4;
    const hasCoordinates = !!(clinicData.latitude && clinicData.longitude);

    // License and accreditation features
    const hasLicenseNumber = !!clinicData.license_number?.trim();
    const licenseFormatValid = this.validateLicenseFormat(clinicData.license_number);
    const licenseLength = clinicData.license_number?.length || 0;
    const hasAccreditation = !!clinicData.accreditation?.trim();
    const hasTaxId = !!clinicData.tax_id?.trim();
    const taxIdFormatValid = this.validateTaxIdFormat(clinicData.tax_id);

    // Business maturity features
    const yearEstablished = clinicData.year_established || currentYear;
    const yearsInBusiness = Math.max(0, currentYear - yearEstablished);
    const isNewBusiness = yearsInBusiness < 1;
    const isEstablishedBusiness = yearsInBusiness >= 5;

    // Scale features
    const numberOfDoctors = clinicData.number_of_doctors || 1;
    const numberOfStaff = clinicData.number_of_staff || 0;
    const doctorToStaffRatio = numberOfDoctors > 0 ? numberOfStaff / numberOfDoctors : 0;
    const isSoloPractice = numberOfDoctors === 1 && numberOfStaff <= 2;
    const isLargeClinic = numberOfDoctors > 10;

    // Service features
    const specialtiesCount = (clinicData.specialties?.length || 0) + (clinicData.custom_specialties?.length || 0);
    const servicesCount = (clinicData.services?.length || 0) + (clinicData.custom_services?.length || 0);
    const hasCustomSpecialties = (clinicData.custom_specialties?.length || 0) > 0;
    const hasCustomServices = (clinicData.custom_services?.length || 0) > 0;
    const specialtyDiversityScore = this.calculateSpecialtyDiversity(clinicData.specialties, clinicData.custom_specialties);

    // Operating hours features
    const hasOperatingHours = !!clinicData.operating_hours;
    const hoursCoverageScore = this.calculateHoursCoverage(clinicData.operating_hours);
    const { hasWeekendHours, hasExtendedHours } = this.analyzeOperatingHours(clinicData.operating_hours);

    // Submission pattern features
    const submissionTimeHour = now.getHours();
    const isBusinessHoursSubmission = submissionTimeHour >= 9 && submissionTimeHour <= 17;
    const submissionDayOfWeek = now.getDay();
    const isWeekdaySubmission = submissionDayOfWeek >= 1 && submissionDayOfWeek <= 5;

    // Text analysis features
    const descriptionLength = clinicData.description?.length || 0;
    const hasDescription = descriptionLength > 0;
    const descriptionQualityScore = this.calculateDescriptionQuality(clinicData.description);

    return {
      clinic_name_length: clinicNameLength,
      has_website: hasWebsite,
      website_domain_age: websiteDomainAge,
      has_phone: hasPhone,
      phone_format_valid: phoneFormatValid,
      has_complete_address: hasCompleteAddress,
      address_completeness_score: addressCompletenessScore,
      has_coordinates: hasCoordinates,
      has_license_number: hasLicenseNumber,
      license_format_valid: licenseFormatValid,
      license_length: licenseLength,
      has_accreditation: hasAccreditation,
      has_tax_id: hasTaxId,
      tax_id_format_valid: taxIdFormatValid,
      year_established: yearEstablished,
      years_in_business: yearsInBusiness,
      is_new_business: isNewBusiness,
      is_established_business: isEstablishedBusiness,
      number_of_doctors: numberOfDoctors,
      number_of_staff: numberOfStaff,
      doctor_to_staff_ratio: doctorToStaffRatio,
      is_solo_practice: isSoloPractice,
      is_large_clinic: isLargeClinic,
      specialties_count: specialtiesCount,
      services_count: servicesCount,
      has_custom_specialties: hasCustomSpecialties,
      has_custom_services: hasCustomServices,
      specialty_diversity_score: specialtyDiversityScore,
      has_operating_hours: hasOperatingHours,
      hours_coverage_score: hoursCoverageScore,
      has_weekend_hours: hasWeekendHours,
      has_extended_hours: hasExtendedHours,
      submission_time_hour: submissionTimeHour,
      is_business_hours_submission: isBusinessHoursSubmission,
      submission_day_of_week: submissionDayOfWeek,
      is_weekday_submission: isWeekdaySubmission,
      description_length: descriptionLength,
      has_description: hasDescription,
      description_quality_score: descriptionQualityScore
    };
  }

  // Calculate risk score using weighted feature scoring
  private static calculateRiskScore(features: ClinicFeatures): number {
    let riskScore = 0.5; // Base score

    // Business legitimacy factors (negative weight = lower risk)
    if (features.has_website && features.website_domain_age && features.website_domain_age > 2) {
      riskScore -= 0.1;
    }
    if (features.phone_format_valid) {
      riskScore -= 0.05;
    }
    if (features.has_license_number && features.license_format_valid) {
      riskScore -= 0.15;
    }
    if (features.has_accreditation) {
      riskScore -= 0.1;
    }
    if (features.tax_id_format_valid) {
      riskScore -= 0.05;
    }

    // Business maturity factors
    if (features.is_established_business) {
      riskScore -= 0.1;
    } else if (features.is_new_business) {
      riskScore += 0.15;
    }

    // Scale and structure factors
    if (features.is_solo_practice) {
      riskScore += 0.1;
    } else if (features.is_large_clinic) {
      riskScore -= 0.05;
    }

    // Completeness factors
    if (features.address_completeness_score < 0.5) {
      riskScore += 0.1;
    }
    if (features.clinic_name_length < 3) {
      riskScore += 0.15;
    }

    // Service diversity factors
    if (features.specialties_count === 0) {
      riskScore += 0.1;
    }
    if (features.has_custom_specialties && features.specialties_count > 5) {
      riskScore += 0.05; // Too many custom specialties might be unusual
    }

    // Operating pattern factors
    if (!features.has_operating_hours) {
      riskScore += 0.05;
    }
    if (features.hours_coverage_score < 0.3) {
      riskScore += 0.05;
    }

    // Submission pattern factors
    if (!features.is_business_hours_submission) {
      riskScore += 0.05;
    }
    if (!features.is_weekday_submission) {
      riskScore += 0.03;
    }

    // Description quality
    if (features.description_quality_score < 0.3) {
      riskScore += 0.05;
    }

    // Ensure score is within bounds
    return Math.max(0.0, Math.min(1.0, riskScore));
  }

  // Determine risk level from score
  private static determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (riskScore <= this.RISK_THRESHOLDS.low_risk_max) {
      return 'LOW';
    } else if (riskScore <= this.RISK_THRESHOLDS.medium_risk_max) {
      return 'MEDIUM';
    } else {
      return 'HIGH';
    }
  }

  // Recommend account status based on risk and features
  private static recommendAccountStatus(
    riskScore: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    features: ClinicFeatures
  ): 'ACTIVE_LIMITED' | 'RESTRICTED' | 'VERIFICATION_REQUIRED' {
    // High risk always gets restricted
    if (riskLevel === 'HIGH') {
      return 'RESTRICTED';
    }

    // Low risk with complete business info gets active limited
    if (riskLevel === 'LOW' && 
        features.has_license_number && 
        features.license_format_valid &&
        features.has_complete_address &&
        features.phone_format_valid) {
      return 'ACTIVE_LIMITED';
    }

    // Medium risk or incomplete info gets verification required
    return 'VERIFICATION_REQUIRED';
  }

  // Generate specific risk flags
  private static generateRiskFlags(features: ClinicFeatures, riskScore: number): string[] {
    const flags: string[] = [];

    if (!features.has_website) flags.push('NO_WEBSITE');
    if (features.has_website && (!features.website_domain_age || features.website_domain_age < 1)) {
      flags.push('NEW_WEBSITE');
    }
    if (!features.phone_format_valid) flags.push('INVALID_PHONE_FORMAT');
    if (!features.has_license_number) flags.push('NO_LICENSE_NUMBER');
    if (features.has_license_number && !features.license_format_valid) {
      flags.push('INVALID_LICENSE_FORMAT');
    }
    if (!features.has_accreditation) flags.push('NO_ACCREDITATION');
    if (!features.has_complete_address) flags.push('INCOMPLETE_ADDRESS');
    if (!features.has_coordinates) flags.push('NO_LOCATION_VERIFICATION');
    if (features.is_new_business) flags.push('NEW_BUSINESS');
    if (features.is_solo_practice) flags.push('SOLO_PRACTICE');
    if (features.specialties_count === 0) flags.push('NO_SPECIALTIES');
    if (features.clinic_name_length < 3) flags.push('SHORT_CLINIC_NAME');
    if (!features.is_business_hours_submission) flags.push('AFTER_HOURS_SUBMISSION');
    if (features.description_quality_score < 0.3) flags.push('POOR_DESCRIPTION_QUALITY');

    return flags;
  }

  // Generate human-readable assessment reason
  private static generateAssessmentReason(
    features: ClinicFeatures,
    riskScore: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): string {
    const positiveFactors = [];
    const negativeFactors = [];

    if (features.has_license_number && features.license_format_valid) {
      positiveFactors.push('valid medical license');
    }
    if (features.has_accreditation) {
      positiveFactors.push('professional accreditation');
    }
    if (features.is_established_business) {
      positiveFactors.push('established business history');
    }
    if (features.has_complete_address && features.has_coordinates) {
      positiveFactors.push('verified location');
    }

    if (!features.has_license_number) {
      negativeFactors.push('missing license information');
    }
    if (features.is_new_business) {
      negativeFactors.push('newly established business');
    }
    if (!features.has_complete_address) {
      negativeFactors.push('incomplete address information');
    }
    if (!features.phone_format_valid) {
      negativeFactors.push('invalid phone format');
    }

    let reason = `Risk assessment completed with ${riskLevel} risk level (score: ${riskScore.toFixed(2)})`;
    
    if (positiveFactors.length > 0) {
      reason += `. Positive indicators: ${positiveFactors.join(', ')}`;
    }
    
    if (negativeFactors.length > 0) {
      reason += `. Areas of concern: ${negativeFactors.join(', ')}`;
    }

    return reason;
  }

  // Helper methods for feature extraction
  private static simulateDomainAge(website?: string): number | undefined {
    if (!website) return undefined;
    // Simulate domain age based on common patterns
    // In production, this would use a WHOIS API
    const currentYear = new Date().getFullYear();
    const domainPatterns = [
      { pattern: /clinic/i, age: 3 },
      { pattern: /medical/i, age: 5 },
      { pattern: /health/i, age: 4 },
      { pattern: /\d{4}/, age: currentYear - parseInt(website.match(/\d{4}/)?.[0] || '2020') }
    ];
    
    for (const { pattern, age } of domainPatterns) {
      if (pattern.test(website)) return age;
    }
    
    return Math.floor(Math.random() * 10) + 1; // Random 1-10 years
  }

  private static validatePhoneFormat(phone?: string): boolean {
    if (!phone) return false;
    // Basic phone format validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  }

  private static validateLicenseFormat(license?: string): boolean {
    if (!license) return false;
    // Basic license format validation (alphanumeric, 6-20 chars)
    const licenseRegex = /^[A-Z0-9]{6,20}$/i;
    return licenseRegex.test(license.replace(/[\s\-]/g, ''));
  }

  private static validateTaxIdFormat(taxId?: string): boolean {
    if (!taxId) return false;
    // Basic tax ID format validation
    const taxIdRegex = /^\d{9,12}$/;
    return taxIdRegex.test(taxId.replace(/[\s\-]/g, ''));
  }

  private static calculateSpecialtyDiversity(
    standardSpecialties?: string[],
    customSpecialties?: string[]
  ): number {
    const totalSpecialties = (standardSpecialties?.length || 0) + (customSpecialties?.length || 0);
    if (totalSpecialties === 0) return 0;
    
    // Diversity based on mix of standard and custom specialties
    const standardCount = standardSpecialties?.length || 0;
    const customCount = customSpecialties?.length || 0;
    
    // Optimal diversity is a mix of standard and custom
    const diversityScore = (standardCount > 0 && customCount > 0) ? 0.8 : 
                           (standardCount > 0) ? 0.6 : 0.4;
    
    return Math.min(1.0, diversityScore * (totalSpecialties / 5)); // Scale by number
  }

  private static calculateHoursCoverage(operatingHours?: any): number {
    if (!operatingHours) return 0;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalHours = 0;
    let daysWithHours = 0;
    
    for (const day of days) {
      const dayHours = operatingHours[day];
      if (dayHours?.open && dayHours?.close) {
        const open = this.parseTime(dayHours.open);
        const close = this.parseTime(dayHours.close);
        if (open !== null && close !== null) {
          totalHours += (close - open) / 100; // Convert to hours
          daysWithHours++;
        }
      }
    }
    
    return daysWithHours > 0 ? Math.min(1.0, totalHours / 70) : 0; // Max 70 hours/week
  }

  private static analyzeOperatingHours(operatingHours?: any): { hasWeekendHours: boolean; hasExtendedHours: boolean } {
    let hasWeekendHours = false;
    let hasExtendedHours = false;
    
    if (operatingHours) {
      // Check weekend hours
      const weekendDays = ['saturday', 'sunday'];
      for (const day of weekendDays) {
        const dayHours = operatingHours[day];
        if (dayHours?.open && dayHours?.close) {
          hasWeekendHours = true;
          break;
        }
      }
      
      // Check extended hours (after 6 PM)
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      for (const day of weekdays) {
        const dayHours = operatingHours[day];
        if (dayHours?.close) {
          const closeTime = this.parseTime(dayHours.close);
          if (closeTime && closeTime > 1800) { // After 6 PM
            hasExtendedHours = true;
            break;
          }
        }
      }
    }
    
    return { hasWeekendHours, hasExtendedHours };
  }

  private static parseTime(timeStr: string): number | null {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 100 + minutes;
  }

  private static calculateDescriptionQuality(description?: string): number {
    if (!description) return 0;
    
    let score = 0;
    const length = description.length;
    
    // Length scoring
    if (length > 50) score += 0.3;
    if (length > 150) score += 0.2;
    if (length > 300) score += 0.2;
    
    // Content quality indicators
    const medicalTerms = ['medical', 'healthcare', 'patients', 'treatment', 'care', 'professional'];
    const foundTerms = medicalTerms.filter(term => 
      description.toLowerCase().includes(term)
    ).length;
    score += Math.min(0.3, foundTerms * 0.1);
    
    return Math.min(1.0, score);
  }

  // Get model version
  static getModelVersion(): string {
    return this.MODEL_VERSION;
  }

  // Get risk thresholds
  static getRiskThresholds(): RiskThresholds {
    return { ...this.RISK_THRESHOLDS };
  }
}
