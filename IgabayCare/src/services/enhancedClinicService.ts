import { supabase } from '../supabaseClient';
import { ClinicRiskAssessmentService, type RiskAssessmentResult } from './clinicRiskAssessmentService';

// Enhanced clinic data interface with risk assessment
export interface EnhancedClinicData {
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  accreditation?: string;
  tax_id?: string;
  year_established?: number;
  specialties?: string[];
  custom_specialties?: string[];
  services?: string[];
  custom_services?: string[];
  operating_hours?: any;
  number_of_doctors?: number;
  number_of_staff?: number;
  description?: string;
  profile_pic_url?: string;
  latitude?: number;
  longitude?: number;
}

export interface ClinicProfile {
  id: string;
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  accreditation?: string;
  tax_id?: string;
  year_established?: number;
  specialties?: string[];
  custom_specialties?: string[];
  services?: string[];
  custom_services?: string[];
  operating_hours?: any;
  number_of_doctors?: number;
  number_of_staff?: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profile_pic_url?: string;
  latitude?: number;
  longitude?: number;
  // Risk assessment fields
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  account_status?: 'ACTIVE_LIMITED' | 'RESTRICTED' | 'VERIFICATION_REQUIRED';
  risk_flags?: string[];
  risk_assessed_at?: string;
  risk_model_version?: string;
}

export class EnhancedClinicService {
  // Main clinic creation method with ML risk assessment
  static async createClinicWithRiskAssessment(
    data: EnhancedClinicData
  ): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile; riskAssessment?: RiskAssessmentResult }> {
    try {
      console.log('🏥 Creating clinic with ML risk assessment:', data.clinic_name);
      
      // Step 1: Perform ML risk assessment
      const riskAssessment = await ClinicRiskAssessmentService.assessClinicRisk(data);
      console.log('📊 Risk assessment completed:', {
        score: riskAssessment.risk_score,
        level: riskAssessment.risk_level,
        status: riskAssessment.account_status,
        flags: riskAssessment.risk_flags.length
      });

      // Step 2: Prepare clinic data with risk assessment results
      const clinicDataWithRisk = {
        ...data,
        // Set status based on risk assessment
        status: this.mapRiskToStatus(riskAssessment.account_status),
        // Add risk assessment fields
        risk_score: riskAssessment.risk_score,
        risk_level: riskAssessment.risk_level,
        account_status: riskAssessment.account_status,
        risk_flags: riskAssessment.risk_flags,
        risk_assessed_at: new Date().toISOString(),
        risk_model_version: ClinicRiskAssessmentService.getModelVersion()
      };

      // Step 3: Create clinic record
      const { data: clinic, error } = await supabase
        .from('clinics')
        .insert([clinicDataWithRisk])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating clinic:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Clinic created successfully with risk assessment:', clinic.id);

      // Step 4: Log risk assessment for audit trail
      await this.logRiskAssessment(clinic.id, riskAssessment);

      // Step 5: Return clinic profile and risk assessment
      const clinicProfile: ClinicProfile = {
        ...clinic,
        risk_score: riskAssessment.risk_score,
        risk_level: riskAssessment.risk_level,
        account_status: riskAssessment.account_status,
        risk_flags: riskAssessment.risk_flags,
        risk_assessed_at: clinic.risk_assessed_at,
        risk_model_version: clinic.risk_model_version
      };

      return { 
        success: true, 
        clinic: clinicProfile, 
        riskAssessment 
      };

    } catch (error) {
      console.error('💥 Exception in createClinicWithRiskAssessment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create clinic with risk assessment';
      return { success: false, error: errorMessage };
    }
  }

  // Update clinic with new risk assessment
  static async updateClinicRiskAssessment(
    clinicId: string
  ): Promise<{ success: boolean; error?: string; riskAssessment?: RiskAssessmentResult }> {
    try {
      console.log('🔄 Updating risk assessment for clinic:', clinicId);

      // Get current clinic data
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error || !clinic) {
        console.error('❌ Error fetching clinic for reassessment:', error);
        return { success: false, error: 'Clinic not found' };
      }

      // Perform new risk assessment
      const riskAssessment = await ClinicRiskAssessmentService.assessClinicRisk(clinic);

      // Update clinic with new risk assessment
      const { error: updateError } = await supabase
        .from('clinics')
        .update({
          risk_score: riskAssessment.risk_score,
          risk_level: riskAssessment.risk_level,
          account_status: riskAssessment.account_status,
          risk_flags: riskAssessment.risk_flags,
          risk_assessed_at: new Date().toISOString(),
          risk_model_version: ClinicRiskAssessmentService.getModelVersion(),
          status: this.mapRiskToStatus(riskAssessment.account_status),
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId);

      if (updateError) {
        console.error('❌ Error updating clinic risk assessment:', updateError);
        return { success: false, error: updateError.message };
      }

      // Log the new assessment
      await this.logRiskAssessment(clinicId, riskAssessment);

      console.log('✅ Risk assessment updated successfully');
      return { success: true, riskAssessment };

    } catch (error) {
      console.error('💥 Exception updating risk assessment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update risk assessment';
      return { success: false, error: errorMessage };
    }
  }

  // Get clinic with risk assessment information
  static async getClinicWithRiskAssessment(
    userId: string
  ): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, clinic: undefined }; // No clinic found
        }
        console.error('❌ Error fetching clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinic };
    } catch (error) {
      console.error('💥 Exception fetching clinic:', error);
      return { success: false, error: 'Failed to fetch clinic' };
    }
  }

  // Get clinics filtered by account status for public access
  static async getClinicsByAccountStatus(
    accountStatus?: 'ACTIVE_LIMITED' | 'RESTRICTED' | 'VERIFICATION_REQUIRED'
  ): Promise<{ success: boolean; error?: string; clinics?: ClinicProfile[] }> {
    try {
      let query = supabase
        .from('clinics')
        .select('*')
        .order('clinic_name');

      if (accountStatus) {
        query = query.eq('account_status', accountStatus);
      } else {
        // By default, only show ACTIVE_LIMITED clinics to the public
        query = query.eq('account_status', 'ACTIVE_LIMITED');
      }

      const { data: clinics, error } = await query;

      if (error) {
        console.error('❌ Error fetching clinics by status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinics: clinics || [] };
    } catch (error) {
      console.error('💥 Exception fetching clinics:', error);
      return { success: false, error: 'Failed to fetch clinics' };
    }
  }

  // Check if clinic can perform specific actions based on account status
  static getClinicCapabilities(clinic: ClinicProfile): {
    canAcceptAppointments: boolean;
    canEditProfile: boolean;
    canAddDoctors: boolean;
    isVisibleInSearch: boolean;
    canSetPricing: boolean;
    restrictions: string[];
  } {
    const capabilities = {
      canAcceptAppointments: false,
      canEditProfile: false,
      canAddDoctors: false,
      isVisibleInSearch: false,
      canSetPricing: false,
      restrictions: [] as string[]
    };

    switch (clinic.account_status) {
      case 'ACTIVE_LIMITED':
        capabilities.canAcceptAppointments = true;
        capabilities.canEditProfile = true;
        capabilities.canAddDoctors = true;
        capabilities.isVisibleInSearch = true;
        capabilities.canSetPricing = true;
        capabilities.restrictions = [
          'Maximum 10 appointments per day',
          'Cannot access advanced analytics',
          'Limited promotional features'
        ];
        break;

      case 'VERIFICATION_REQUIRED':
        capabilities.canEditProfile = true;
        capabilities.canAddDoctors = false;
        capabilities.canAcceptAppointments = false;
        capabilities.isVisibleInSearch = false;
        capabilities.canSetPricing = false;
        capabilities.restrictions = [
          'Cannot accept appointments until verified',
          'Not visible in public search',
          'Cannot add doctors or staff',
          'Limited profile editing'
        ];
        break;

      case 'RESTRICTED':
        capabilities.canEditProfile = false;
        capabilities.canAddDoctors = false;
        capabilities.canAcceptAppointments = false;
        capabilities.isVisibleInSearch = false;
        capabilities.canSetPricing = false;
        capabilities.restrictions = [
          'All functionality restricted',
          'Manual review required',
          'Contact support for assistance'
        ];
        break;
    }

    return capabilities;
  }

  // Helper method to log risk assessment
  private static async logRiskAssessment(
    clinicId: string, 
    riskAssessment: RiskAssessmentResult
  ): Promise<void> {
    try {
      await supabase
        .from('clinic_risk_assessments')
        .insert([{
          clinic_id: clinicId,
          model_version: ClinicRiskAssessmentService.getModelVersion(),
          risk_score: riskAssessment.risk_score,
          risk_level: riskAssessment.risk_level,
          account_status: riskAssessment.account_status,
          risk_flags: riskAssessment.risk_flags,
          feature_vector: riskAssessment.feature_vector,
          assessment_reason: riskAssessment.assessment_reason
        }]);

      console.log('📝 Risk assessment logged successfully');
    } catch (error) {
      console.error('⚠️ Failed to log risk assessment:', error);
      // Don't fail the operation if logging fails
    }
  }

  // Map account status to legacy status field
  private static mapRiskToStatus(
    accountStatus: 'ACTIVE_LIMITED' | 'RESTRICTED' | 'VERIFICATION_REQUIRED'
  ): 'pending' | 'approved' | 'rejected' {
    switch (accountStatus) {
      case 'ACTIVE_LIMITED':
        return 'approved';
      case 'VERIFICATION_REQUIRED':
        return 'pending';
      case 'RESTRICTED':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  // Get risk assessment statistics
  static async getRiskAssessmentStats(): Promise<{
    totalClinics: number;
    lowRiskCount: number;
    mediumRiskCount: number;
    highRiskCount: number;
    activeLimitedCount: number;
    verificationRequiredCount: number;
    restrictedCount: number;
  }> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('risk_level, account_status');

      if (error) {
        console.error('❌ Error fetching risk stats:', error);
        throw error;
      }

      const stats = {
        totalClinics: clinics?.length || 0,
        lowRiskCount: 0,
        mediumRiskCount: 0,
        highRiskCount: 0,
        activeLimitedCount: 0,
        verificationRequiredCount: 0,
        restrictedCount: 0
      };

      clinics?.forEach(clinic => {
        // Count risk levels
        switch (clinic.risk_level) {
          case 'LOW':
            stats.lowRiskCount++;
            break;
          case 'MEDIUM':
            stats.mediumRiskCount++;
            break;
          case 'HIGH':
            stats.highRiskCount++;
            break;
        }

        // Count account statuses
        switch (clinic.account_status) {
          case 'ACTIVE_LIMITED':
            stats.activeLimitedCount++;
            break;
          case 'VERIFICATION_REQUIRED':
            stats.verificationRequiredCount++;
            break;
          case 'RESTRICTED':
            stats.restrictedCount++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('💥 Exception fetching risk stats:', error);
      throw error;
    }
  }
}
