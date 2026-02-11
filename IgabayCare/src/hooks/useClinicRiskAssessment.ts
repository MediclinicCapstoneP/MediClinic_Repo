import { useState } from 'react';
import { EnhancedClinicService, type EnhancedClinicData, type ClinicProfile } from '../services/enhancedClinicService';
import type { RiskAssessmentResult } from '../services/clinicRiskAssessmentService';

interface UseClinicRiskAssessmentReturn {
  createClinicWithAssessment: (clinicData: EnhancedClinicData) => Promise<{
    success: boolean;
    error?: string;
    clinic?: ClinicProfile;
    riskAssessment?: RiskAssessmentResult;
  }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  getClinicCapabilities: (clinic: ClinicProfile) => {
    canAcceptAppointments: boolean;
    canEditProfile: boolean;
    canAddDoctors: boolean;
    isVisibleInSearch: boolean;
    canSetPricing: boolean;
    restrictions: string[];
  };
}

export const useClinicRiskAssessment = (): UseClinicRiskAssessmentReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClinicWithAssessment = async (clinicData: EnhancedClinicData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await EnhancedClinicService.createClinicWithRiskAssessment(clinicData);
      
      if (!result.success) {
        setError(result.error || 'Failed to create clinic');
        return result;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getClinicCapabilities = (clinic: ClinicProfile) => {
    return EnhancedClinicService.getClinicCapabilities(clinic);
  };

  return {
    createClinicWithAssessment,
    isLoading,
    error,
    clearError,
    getClinicCapabilities
  };
};
