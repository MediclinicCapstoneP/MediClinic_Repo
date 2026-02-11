/**
 * ML Risk Assessment Service
 * Integrates with Python ML model API for clinic risk assessment
 */

export interface MLRiskAssessmentResult {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  account_status: 'ACTIVE_LIMITED' | 'VERIFICATION_REQUIRED' | 'RESTRICTED';
  confidence: number;
  model_version: string;
  prediction_timestamp: string;
  api_version: string;
  request_id: string;
}

export interface ClinicDataForML {
  clinic_name: string;
  website?: string;
  phone?: string;
  license_number?: string;
  accreditation?: string;
  year_established?: number;
  number_of_doctors?: number;
  number_of_staff?: number;
  
  // Behavioral metrics
  mouseMoveCount?: number;
  keyPressCount?: number;
  timeOnPageSeconds?: number;
  mouseMoveRate?: number;
  keyPressRate?: number;
  interactionBalance?: number;
  interactionScore?: number;
  idleRatio?: number;
}

export interface MLApiResponse {
  success: boolean;
  data?: MLRiskAssessmentResult;
  error?: string;
}

class MLRiskAssessmentService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    // For Vercel deployment, use relative URL
    this.baseUrl = baseUrl || (typeof window !== 'undefined' && window.location.origin === 'http://localhost:3000' 
      ? 'http://localhost:5000' 
      : ''); // Empty for Vercel (uses same origin)
    this.apiKey = apiKey;
  }

  /**
   * Assess risk for a single clinic
   */
  async assessClinicRisk(clinicData: ClinicDataForML): Promise<MLApiResponse> {
    try {
      // Use Vercel serverless endpoint when deployed
      const endpoint = this.baseUrl ? `${this.baseUrl}/assess-risk` : '/api/ml-risk-assessment';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(clinicData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || 'API request failed'
        };
      }

      return result;
    } catch (error) {
      console.error('ML Risk Assessment API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Assess risk for multiple clinics (batch processing)
   */
  async assessBatchClinicRisk(clinics: ClinicDataForML[]): Promise<MLApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/batch-assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({ clinics })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || 'API request failed'
        };
      }

      return result;
    } catch (error) {
      console.error('ML Batch Risk Assessment API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<MLApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/model-info`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || 'API request failed'
        };
      }

      return result;
    } catch (error) {
      console.error('ML Model Info API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Validate clinic data format
   */
  async validateClinicData(clinicData: ClinicDataForML): Promise<MLApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate-clinic-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(clinicData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || 'API request failed'
        };
      }

      return result;
    } catch (error) {
      console.error('ML Data Validation API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<MLApiResponse> {
    try {
      // Use Vercel serverless endpoint when deployed
      const endpoint = this.baseUrl ? `${this.baseUrl}/health` : '/api/ml-risk-assessment/health';
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || 'API request failed'
        };
      }

      return result;
    } catch (error) {
      console.error('ML Health Check API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Convert ML result to account status capabilities
   */
  getAccountCapabilities(accountStatus: string) {
    switch (accountStatus) {
      case 'ACTIVE_LIMITED':
        return {
          canAcceptAppointments: true,
          canEditProfile: true,
          canAddDoctors: true,
          isVisibleInSearch: true,
          canSetPricing: true,
          restrictions: []
        };
      
      case 'VERIFICATION_REQUIRED':
        return {
          canAcceptAppointments: false,
          canEditProfile: true,
          canAddDoctors: false,
          isVisibleInSearch: false,
          canSetPricing: false,
          restrictions: ['verification_pending']
        };
      
      case 'RESTRICTED':
        return {
          canAcceptAppointments: false,
          canEditProfile: false,
          canAddDoctors: false,
          isVisibleInSearch: false,
          canSetPricing: false,
          restrictions: ['manual_review_required']
        };
      
      default:
        return {
          canAcceptAppointments: false,
          canEditProfile: false,
          canAddDoctors: false,
          isVisibleInSearch: false,
          canSetPricing: false,
          restrictions: ['unknown_status']
        };
    }
  }

  /**
   * Get risk level color and styling
   */
  getRiskLevelStyling(riskLevel: string) {
    switch (riskLevel) {
      case 'LOW':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅',
          progressColor: 'bg-green-500'
        };
      
      case 'MEDIUM':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⚠️',
          progressColor: 'bg-yellow-500'
        };
      
      case 'HIGH':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '❌',
          progressColor: 'bg-red-500'
        };
      
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          progressColor: 'bg-gray-500'
        };
    }
  }
}

// Create singleton instance
export const mlRiskAssessmentService = new MLRiskAssessmentService(
  process.env.REACT_APP_ML_API_URL || 'http://localhost:5000',
  process.env.REACT_APP_ML_API_KEY
);

export default MLRiskAssessmentService;
