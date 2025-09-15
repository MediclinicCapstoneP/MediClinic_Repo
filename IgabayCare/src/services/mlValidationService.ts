import { supabase } from '../supabaseClient';

// ML Validation Types
export interface MLValidationFeatures {
  // Common features
  timestamp?: number;
  user_age_days?: number;
  
  // Booking validation features
  booking_frequency_24h?: number;
  booking_frequency_7d?: number;
  time_since_last_booking?: number;
  consultation_fee_amount?: number;
  booking_time_of_day?: number;
  booking_day_of_week?: number;
  same_clinic_frequency?: number;
  patient_name_pattern_score?: number;
  phone_pattern_score?: number;
  email_pattern_score?: number;
  
  // Clinic validation features
  license_document_quality?: number;
  business_name_legitimacy_score?: number;
  address_verification_score?: number;
  years_established?: number;
  specialties_count?: number;
  website_quality_score?: number;
  phone_verification_status?: number;
  email_verification_status?: number;
  document_consistency_score?: number;
}

export interface MLValidationResult {
  score: number; // 0.0 to 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  confidence: number;
  recommendation: 'approve' | 'flag' | 'reject' | 'manual_review';
}

export interface ValidationModel {
  id: string;
  name: string;
  type: 'booking_validation' | 'clinic_verification' | 'fraud_detection';
  version: string;
  thresholds: {
    approve: number;
    flag: number;
    reject: number;
  };
  features: string[];
  weights: { [feature: string]: number };
}

export class MLValidationService {
  private models: Map<string, ValidationModel> = new Map();
  private initialized = false;

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    if (this.initialized) return;

    try {
      // Load models from database
      const { data: models, error } = await supabase
        .from('ml_validation_models')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('Error loading ML models:', error);
        // Use default models
        this.loadDefaultModels();
      } else {
        models?.forEach(model => {
          this.models.set(model.model_type, {
            id: model.id,
            name: model.model_name,
            type: model.model_type,
            version: model.model_version,
            thresholds: model.threshold_scores,
            features: model.model_config.features || [],
            weights: model.feature_weights || {}
          });
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing ML models:', error);
      this.loadDefaultModels();
    }
  }

  private loadDefaultModels() {
    // Default booking validation model
    this.models.set('booking_validation', {
      id: 'default_booking',
      name: 'Booking Validation Model v1.0',
      type: 'booking_validation',
      version: '1.0',
      thresholds: {
        approve: 0.7,
        flag: 0.4,
        reject: 0.2
      },
      features: [
        'booking_frequency_24h', 'booking_frequency_7d', 'time_since_last_booking',
        'consultation_fee_amount', 'booking_time_of_day', 'same_clinic_frequency',
        'patient_name_pattern_score', 'phone_pattern_score', 'email_pattern_score'
      ],
      weights: {
        booking_frequency_24h: -0.3,
        booking_frequency_7d: -0.2,
        time_since_last_booking: 0.1,
        consultation_fee_amount: 0.05,
        booking_time_of_day: 0.1,
        same_clinic_frequency: -0.15,
        patient_name_pattern_score: 0.2,
        phone_pattern_score: 0.15,
        email_pattern_score: 0.15
      }
    });

    // Default clinic verification model
    this.models.set('clinic_verification', {
      id: 'default_clinic',
      name: 'Clinic Verification Model v1.0',
      type: 'clinic_verification',
      version: '1.0',
      thresholds: {
        approve: 0.8,
        flag: 0.6,
        reject: 0.3
      },
      features: [
        'license_document_quality', 'business_name_legitimacy_score',
        'address_verification_score', 'years_established', 'specialties_count',
        'website_quality_score', 'phone_verification_status', 'email_verification_status',
        'document_consistency_score'
      ],
      weights: {
        license_document_quality: 0.25,
        business_name_legitimacy_score: 0.15,
        address_verification_score: 0.2,
        years_established: 0.1,
        specialties_count: 0.05,
        website_quality_score: 0.1,
        phone_verification_status: 0.05,
        email_verification_status: 0.05,
        document_consistency_score: 0.05
      }
    });
  }

  /**
   * Validate a booking attempt
   */
  async validateBooking(
    patientId: string,
    clinicId: string,
    appointmentData: any
  ): Promise<MLValidationResult> {
    await this.initializeModels();

    try {
      // Extract features for booking validation
      const features = await this.extractBookingFeatures(patientId, clinicId, appointmentData);
      
      // Get validation model
      const model = this.models.get('booking_validation');
      if (!model) {
        throw new Error('Booking validation model not found');
      }

      // Calculate validation score
      const result = this.calculateValidationScore(features, model);

      // Log validation result
      await this.logValidationResult(model.id, 'appointment', appointmentData.id || 'pending', result, features);

      return result;

    } catch (error) {
      console.error('Error validating booking:', error);
      // Return default safe result
      return {
        score: 0.5,
        riskLevel: 'medium',
        flags: ['validation_error'],
        confidence: 0.0,
        recommendation: 'manual_review'
      };
    }
  }

  /**
   * Validate a clinic registration
   */
  async validateClinicRegistration(clinicData: any): Promise<MLValidationResult> {
    await this.initializeModels();

    try {
      // Extract features for clinic validation
      const features = await this.extractClinicFeatures(clinicData);
      
      // Get validation model
      const model = this.models.get('clinic_verification');
      if (!model) {
        throw new Error('Clinic verification model not found');
      }

      // Calculate validation score
      const result = this.calculateValidationScore(features, model);

      // Log validation result
      await this.logValidationResult(model.id, 'clinic', clinicData.id, result, features);

      return result;

    } catch (error) {
      console.error('Error validating clinic:', error);
      // Return default safe result
      return {
        score: 0.6,
        riskLevel: 'medium',
        flags: ['validation_error'],
        confidence: 0.0,
        recommendation: 'manual_review'
      };
    }
  }

  /**
   * Extract features for booking validation
   */
  private async extractBookingFeatures(
    patientId: string,
    clinicId: string,
    appointmentData: any
  ): Promise<MLValidationFeatures> {
    const features: MLValidationFeatures = {};

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get patient information
      const { data: patient } = await supabase
        .from('patients')
        .select('created_at, email, phone, first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patient) {
        // User age in days
        features.user_age_days = Math.floor(
          (now.getTime() - new Date(patient.created_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        // Name pattern analysis
        features.patient_name_pattern_score = this.analyzeNamePattern(
          patient.first_name, patient.last_name
        );

        // Phone pattern analysis
        features.phone_pattern_score = this.analyzePhonePattern(patient.phone);

        // Email pattern analysis
        features.email_pattern_score = this.analyzeEmailPattern(patient.email);
      }

      // Booking frequency analysis
      const { data: recentBookings } = await supabase
        .from('appointments')
        .select('created_at, clinic_id')
        .eq('patient_id', patientId)
        .gte('created_at', weekAgo);

      if (recentBookings) {
        const last24h = recentBookings.filter(b => 
          new Date(b.created_at).getTime() > now.getTime() - 24 * 60 * 60 * 1000
        );
        
        features.booking_frequency_24h = last24h.length;
        features.booking_frequency_7d = recentBookings.length;
        features.same_clinic_frequency = recentBookings.filter(b => b.clinic_id === clinicId).length;

        // Time since last booking
        if (recentBookings.length > 0) {
          const lastBooking = Math.max(...recentBookings.map(b => new Date(b.created_at).getTime()));
          features.time_since_last_booking = Math.floor((now.getTime() - lastBooking) / (60 * 60 * 1000));
        }
      }

      // Appointment timing analysis
      features.consultation_fee_amount = appointmentData.consultationFee || 0;
      features.booking_time_of_day = now.getHours();
      features.booking_day_of_week = now.getDay();
      features.timestamp = now.getTime();

    } catch (error) {
      console.error('Error extracting booking features:', error);
    }

    return features;
  }

  /**
   * Extract features for clinic validation
   */
  private async extractClinicFeatures(clinicData: any): Promise<MLValidationFeatures> {
    const features: MLValidationFeatures = {};

    try {
      // Document quality analysis
      features.license_document_quality = this.analyzeLicenseDocument(clinicData.license_document_url);
      
      // Business name legitimacy
      features.business_name_legitimacy_score = this.analyzeBusinessName(clinicData.clinic_name);
      
      // Address verification
      features.address_verification_score = this.analyzeAddress(
        clinicData.address, clinicData.city, clinicData.state
      );

      // Establishment age
      if (clinicData.year_established) {
        features.years_established = new Date().getFullYear() - clinicData.year_established;
      }

      // Specialties analysis
      features.specialties_count = (clinicData.specialties || []).length;

      // Website quality
      features.website_quality_score = this.analyzeWebsite(clinicData.website);

      // Verification status
      features.phone_verification_status = clinicData.phone ? 1 : 0;
      features.email_verification_status = clinicData.email ? 1 : 0;

      // Document consistency
      features.document_consistency_score = this.analyzeDocumentConsistency(clinicData);

    } catch (error) {
      console.error('Error extracting clinic features:', error);
    }

    return features;
  }

  /**
   * Calculate validation score using model weights
   */
  private calculateValidationScore(
    features: MLValidationFeatures,
    model: ValidationModel
  ): MLValidationResult {
    let weightedScore = 0.5; // Base score
    let totalWeight = 0;
    const flags: string[] = [];

    // Calculate weighted score
    for (const [feature, weight] of Object.entries(model.weights)) {
      const value = features[feature as keyof MLValidationFeatures];
      if (value !== undefined && value !== null) {
        const normalizedValue = this.normalizeFeature(feature, value);
        weightedScore += normalizedValue * weight;
        totalWeight += Math.abs(weight);
      }
    }

    // Normalize final score
    const finalScore = Math.max(0, Math.min(1, weightedScore));

    // Determine risk level and recommendation
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: 'approve' | 'flag' | 'reject' | 'manual_review';

    if (finalScore >= model.thresholds.approve) {
      riskLevel = 'low';
      recommendation = 'approve';
    } else if (finalScore >= model.thresholds.flag) {
      riskLevel = 'medium';
      recommendation = 'flag';
      flags.push('medium_risk_score');
    } else if (finalScore >= model.thresholds.reject) {
      riskLevel = 'high';
      recommendation = 'manual_review';
      flags.push('high_risk_score');
    } else {
      riskLevel = 'critical';
      recommendation = 'reject';
      flags.push('critical_risk_score');
    }

    // Add specific flags based on features
    this.addSpecificFlags(features, flags);

    // Calculate confidence based on available features
    const availableFeatures = model.features.filter(f => features[f as keyof MLValidationFeatures] !== undefined);
    const confidence = availableFeatures.length / model.features.length;

    return {
      score: finalScore,
      riskLevel,
      flags,
      confidence,
      recommendation
    };
  }

  /**
   * Normalize feature values to 0-1 range
   */
  private normalizeFeature(feature: string, value: any): number {
    switch (feature) {
      case 'booking_frequency_24h':
        return Math.min(1, value / 10); // Cap at 10 bookings
      case 'booking_frequency_7d':
        return Math.min(1, value / 20); // Cap at 20 bookings
      case 'time_since_last_booking':
        return Math.min(1, value / 168); // Normalize to hours in a week
      case 'consultation_fee_amount':
        return Math.min(1, value / 5000); // Normalize to 5000 PHP
      case 'booking_time_of_day':
        return value / 24;
      case 'booking_day_of_week':
        return value / 7;
      case 'user_age_days':
        return Math.min(1, value / 365); // Normalize to 1 year
      case 'years_established':
        return Math.min(1, value / 50); // Normalize to 50 years
      case 'specialties_count':
        return Math.min(1, value / 10); // Normalize to 10 specialties
      default:
        return typeof value === 'number' ? Math.min(1, Math.max(0, value)) : value ? 1 : 0;
    }
  }

  /**
   * Add specific flags based on feature analysis
   */
  private addSpecificFlags(features: MLValidationFeatures, flags: string[]) {
    // High frequency flags
    if (features.booking_frequency_24h && features.booking_frequency_24h > 5) {
      flags.push('high_daily_frequency');
    }
    if (features.booking_frequency_7d && features.booking_frequency_7d > 15) {
      flags.push('high_weekly_frequency');
    }

    // Suspicious pattern flags
    if (features.patient_name_pattern_score && features.patient_name_pattern_score < 0.3) {
      flags.push('suspicious_name_pattern');
    }
    if (features.phone_pattern_score && features.phone_pattern_score < 0.3) {
      flags.push('suspicious_phone_pattern');
    }
    if (features.email_pattern_score && features.email_pattern_score < 0.3) {
      flags.push('suspicious_email_pattern');
    }

    // New user flags
    if (features.user_age_days && features.user_age_days < 1) {
      flags.push('new_user_account');
    }

    // Clinic-specific flags
    if (features.license_document_quality && features.license_document_quality < 0.5) {
      flags.push('poor_document_quality');
    }
    if (features.years_established === 0) {
      flags.push('newly_established');
    }
  }

  /**
   * Pattern analysis methods
   */
  private analyzeNamePattern(firstName: string, lastName: string): number {
    if (!firstName || !lastName) return 0.3;
    
    // Check for realistic names (basic heuristics)
    const namePattern = /^[a-zA-Z\s\-'\.]+$/;
    const hasNumbers = /\d/;
    const hasSpecialChars = /[!@#$%^&*()_+=\[\]{};:"\\|,.<>\?]/;
    
    let score = 1.0;
    
    if (!namePattern.test(firstName + lastName)) score -= 0.3;
    if (hasNumbers.test(firstName + lastName)) score -= 0.4;
    if (hasSpecialChars.test(firstName + lastName)) score -= 0.3;
    if (firstName.length < 2 || lastName.length < 2) score -= 0.2;
    
    return Math.max(0, score);
  }

  private analyzePhonePattern(phone: string | null): number {
    if (!phone) return 0.5;
    
    // Philippine phone number patterns
    const philippinePattern = /^(\+63|0)(9\d{9}|[2-8]\d{8})$/;
    const validFormat = /^[\d\s\-\+\(\)]+$/;
    
    let score = 1.0;
    
    if (!validFormat.test(phone)) score -= 0.5;
    if (!philippinePattern.test(phone.replace(/\s|\-|\(|\)/g, ''))) score -= 0.2;
    
    return Math.max(0, score);
  }

  private analyzeEmailPattern(email: string): number {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const suspiciousPatterns = /(\d{5,}|temp|fake|test|disposable)/i;
    
    let score = 1.0;
    
    if (!emailPattern.test(email)) score -= 0.6;
    if (suspiciousPatterns.test(email)) score -= 0.4;
    
    return Math.max(0, score);
  }

  private analyzeLicenseDocument(documentUrl: string | null): number {
    // Placeholder for document quality analysis
    // In a real implementation, this would use image processing/OCR
    return documentUrl ? 0.8 : 0.0;
  }

  private analyzeBusinessName(name: string): number {
    if (!name) return 0.0;
    
    // Check for legitimate business name patterns
    const legitimatePatterns = /\b(clinic|medical|health|hospital|center|care)\b/i;
    const suspiciousPatterns = /\b(test|fake|temp|xxx)\b/i;
    
    let score = 0.5;
    
    if (legitimatePatterns.test(name)) score += 0.3;
    if (suspiciousPatterns.test(name)) score -= 0.6;
    if (name.length < 3) score -= 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  private analyzeAddress(address: string, city: string, state: string): number {
    // Basic address validation
    let score = 0.5;
    
    if (address && address.length > 10) score += 0.2;
    if (city && city.length > 2) score += 0.15;
    if (state && state.length > 2) score += 0.15;
    
    return Math.max(0, Math.min(1, score));
  }

  private analyzeWebsite(website: string | null): number {
    if (!website) return 0.3;
    
    const urlPattern = /^https?:\/\/.+\..+/;
    return urlPattern.test(website) ? 0.8 : 0.2;
  }

  private analyzeDocumentConsistency(clinicData: any): number {
    // Placeholder for document consistency analysis
    // Check if clinic name matches across documents
    return 0.7;
  }

  /**
   * Log validation result to database
   */
  private async logValidationResult(
    modelId: string,
    entityType: string,
    entityId: string,
    result: MLValidationResult,
    features: MLValidationFeatures
  ) {
    try {
      await supabase
        .from('ml_validation_logs')
        .insert({
          model_id: modelId,
          entity_type: entityType,
          entity_id: entityId,
          validation_score: result.score,
          risk_level: result.riskLevel,
          flags: result.flags,
          input_features: features,
          confidence_score: result.confidence,
          action_taken: result.recommendation
        });
    } catch (error) {
      console.error('Error logging validation result:', error);
    }
  }
}

// Export singleton instance
export const mlValidationService = new MLValidationService();
