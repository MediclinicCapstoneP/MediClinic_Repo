import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Shield, Clock, Eye } from 'lucide-react';
import type { RiskAssessmentResult } from '../../services/clinicRiskAssessmentService';
import type { ClinicProfile } from '../../services/enhancedClinicService';

interface ClinicRiskAssessmentResultProps {
  riskAssessment: RiskAssessmentResult;
  clinic: ClinicProfile;
  onNext?: () => void;
}

export const ClinicRiskAssessmentResult: React.FC<ClinicRiskAssessmentResultProps> = ({
  riskAssessment,
  clinic,
  onNext
}) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'HIGH':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Info className="h-6 w-6 text-gray-600" />;
    }
  };

  const getAccountStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE_LIMITED':
        return {
          title: 'Active - Limited Access',
          description: 'Your clinic is approved with full functionality for basic operations.',
          icon: <Shield className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'VERIFICATION_REQUIRED':
        return {
          title: 'Verification Required',
          description: 'Additional verification is needed before full activation.',
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        };
      case 'RESTRICTED':
        return {
          title: 'Restricted Access',
          description: 'Your clinic access is restricted pending manual review.',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Please contact support for assistance.',
          icon: <Info className="h-5 w-5 text-gray-600" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  };

  const getClinicCapabilities = () => {
    const capabilities = {
      canAcceptAppointments: clinic.account_status === 'ACTIVE_LIMITED',
      canEditProfile: true,
      canAddDoctors: clinic.account_status === 'ACTIVE_LIMITED',
      isVisibleInSearch: clinic.account_status === 'ACTIVE_LIMITED',
      canSetPricing: clinic.account_status === 'ACTIVE_LIMITED'
    };

    return capabilities;
  };

  const capabilities = getClinicCapabilities();
  const accountStatusInfo = getAccountStatusInfo(clinic.account_status || 'VERIFICATION_REQUIRED');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Clinic Registration Assessment
        </h1>
        <p className="text-gray-600">
          Your clinic has been evaluated by our automated risk assessment system
        </p>
      </div>

      {/* Risk Level Card */}
      <div className={`rounded-lg border p-6 ${getRiskLevelColor(riskAssessment.risk_level)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskLevelIcon(riskAssessment.risk_level)}
            <div>
              <h2 className="text-xl font-semibold">
                Risk Level: {riskAssessment.risk_level}
              </h2>
              <p className="text-sm opacity-75">
                Risk Score: {(riskAssessment.risk_score * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              riskAssessment.risk_level === 'LOW' ? 'bg-green-500' :
              riskAssessment.risk_level === 'MEDIUM' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${riskAssessment.risk_score * 100}%` }}
          />
        </div>

        <p className="text-sm">
          {riskAssessment.assessment_reason}
        </p>
      </div>

      {/* Account Status Card */}
      <div className={`rounded-lg border p-6 ${accountStatusInfo.color}`}>
        <div className="flex items-center space-x-3 mb-4">
          {accountStatusInfo.icon}
          <div>
            <h3 className="text-lg font-semibold">{accountStatusInfo.title}</h3>
            <p className="text-sm opacity-75">{accountStatusInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {riskAssessment.risk_flags.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assessment Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskAssessment.risk_flags.map((flag, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-gray-700">
                  {flag.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinic Capabilities */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Clinic Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            capabilities.canAcceptAppointments ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <CheckCircle className={`h-5 w-5 ${
              capabilities.canAcceptAppointments ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">Accept Appointments</p>
              <p className="text-xs text-gray-600">
                {capabilities.canAcceptAppointments ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            capabilities.isVisibleInSearch ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <Eye className={`h-5 w-5 ${
              capabilities.isVisibleInSearch ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">Visible in Search</p>
              <p className="text-xs text-gray-600">
                {capabilities.isVisibleInSearch ? 'Visible' : 'Not Visible'}
              </p>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            capabilities.canAddDoctors ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <Shield className={`h-5 w-5 ${
              capabilities.canAddDoctors ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">Add Doctors</p>
              <p className="text-xs text-gray-600">
                {capabilities.canAddDoctors ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            capabilities.canEditProfile ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <CheckCircle className={`h-5 w-5 ${
              capabilities.canEditProfile ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">Edit Profile</p>
              <p className="text-xs text-gray-600">
                {capabilities.canEditProfile ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            capabilities.canSetPricing ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <CheckCircle className={`h-5 w-5 ${
              capabilities.canSetPricing ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <p className="font-medium text-sm">Set Pricing</p>
              <p className="text-xs text-gray-600">
                {capabilities.canSetPricing ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Next Steps
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          {clinic.account_status === 'ACTIVE_LIMITED' && (
            <>
              <p>✅ Your clinic is now active and can start accepting appointments</p>
              <p>📝 Complete your profile by adding doctor information</p>
              <p>💰 Set up pricing for your services</p>
              <p>📊 Monitor your clinic performance in the dashboard</p>
            </>
          )}
          
          {clinic.account_status === 'VERIFICATION_REQUIRED' && (
            <>
              <p>📧 Check your email for verification instructions</p>
              <p>📋 Upload required documents for verification</p>
              <p>⏱️ Verification typically takes 1-3 business days</p>
              <p>📞 You can still edit your profile while verification is pending</p>
            </>
          )}
          
          {clinic.account_status === 'RESTRICTED' && (
            <>
              <p>🚫 Your clinic access is currently restricted</p>
              <p>📧 Check your email for detailed information</p>
              <p>📞 Contact our support team for assistance</p>
              <p>📋 Additional documentation may be required</p>
            </>
          )}
        </div>
      </div>

      {/* Action Button */}
      {onNext && (
        <div className="flex justify-center">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      )}

      {/* Compliance Notice */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>
          This assessment was performed automatically using ML model version {clinic.risk_model_version}.
          The assessment is based on the information provided during registration.
        </p>
        <p className="mt-1">
          For questions about this assessment, please contact our support team.
        </p>
      </div>
    </div>
  );
};
