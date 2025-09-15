import React from 'react';
import {
  Calendar,
  FileText,
  Pill,
  TestTube,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  User,
  MapPin,
  Activity
} from 'lucide-react';
import { HistorySummary } from '../../types/history';

interface MedicalHistoryDashboardProps {
  summary: HistorySummary;
  patientName?: string;
  loading?: boolean;
}

const MedicalHistoryDashboard: React.FC<MedicalHistoryDashboardProps> = ({
  summary,
  patientName,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = [
    {
      label: 'Total Appointments',
      value: summary.total_appointments,
      icon: Calendar,
      color: 'bg-blue-500',
      details: [
        { label: 'Completed', value: summary.completed_appointments },
        { label: 'Upcoming', value: summary.upcoming_appointments },
        { label: 'Cancelled', value: summary.cancelled_appointments }
      ]
    },
    {
      label: 'Medical Records',
      value: summary.total_appointments, // Using appointments as proxy since medical_records count not in summary
      icon: FileText,
      color: 'bg-green-500',
      details: [
        { label: 'Last Visit', value: formatDate(summary.last_visit_date) },
        { label: 'Next Appointment', value: formatDate(summary.next_appointment_date) }
      ]
    },
    {
      label: 'Prescriptions',
      value: summary.total_prescriptions,
      icon: Pill,
      color: 'bg-purple-500',
      details: [
        { label: 'Active', value: summary.active_prescriptions },
        { label: 'Inactive', value: summary.total_prescriptions - summary.active_prescriptions }
      ]
    },
    {
      label: 'Lab Results',
      value: summary.total_lab_results,
      icon: TestTube,
      color: 'bg-yellow-500',
      details: [
        { label: 'Completed', value: summary.total_lab_results - summary.pending_lab_results },
        { label: 'Pending', value: summary.pending_lab_results }
      ]
    },
    {
      label: 'Vaccinations',
      value: summary.total_vaccinations,
      icon: Shield,
      color: 'bg-cyan-500',
      details: []
    },
    {
      label: 'Allergies',
      value: summary.total_allergies,
      icon: AlertTriangle,
      color: 'bg-red-500',
      details: [
        { label: 'Active', value: summary.active_allergies },
        { label: 'Inactive', value: summary.total_allergies - summary.active_allergies }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medical History{patientName ? ` - ${patientName}` : ''}
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive overview of medical records and health information
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {summary.last_visit_date && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Last visit: {formatDate(summary.last_visit_date)}</span>
              </div>
            )}
            {summary.next_appointment_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Next: {formatDate(summary.next_appointment_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            {stat.details.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  {stat.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex justify-between text-sm">
                      <span className="text-gray-600">{detail.label}:</span>
                      <span className="font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chronic Conditions and Current Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chronic Conditions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Chronic Conditions</h3>
          </div>
          {summary.chronic_conditions.length > 0 ? (
            <div className="space-y-2">
              {summary.chronic_conditions.map((condition, index) => (
                <div key={index} className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{condition}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm">No chronic conditions recorded</p>
            </div>
          )}
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Pill className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Current Medications</h3>
          </div>
          {summary.current_medications.length > 0 ? (
            <div className="space-y-2">
              {summary.current_medications.slice(0, 5).map((medication, index) => (
                <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{medication}</span>
                </div>
              ))}
              {summary.current_medications.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    +{summary.current_medications.length - 5} more medications
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Pill className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm">No active medications</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.total_appointments + summary.total_prescriptions + summary.total_lab_results + summary.total_vaccinations}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.completed_appointments}
            </div>
            <div className="text-sm text-gray-600">Completed Visits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summary.active_prescriptions}
            </div>
            <div className="text-sm text-gray-600">Active Medications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.pending_lab_results}
            </div>
            <div className="text-sm text-gray-600">Pending Results</div>
          </div>
        </div>
      </div>

      {/* Health Status Indicators */}
      {(summary.active_allergies > 0 || summary.pending_lab_results > 0 || summary.upcoming_appointments > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Status Indicators</h3>
          <div className="space-y-3">
            {summary.active_allergies > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {summary.active_allergies} Active {summary.active_allergies === 1 ? 'Allergy' : 'Allergies'}
                  </p>
                  <p className="text-xs text-red-600">Review with healthcare provider</p>
                </div>
              </div>
            )}
            {summary.pending_lab_results > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <TestTube className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {summary.pending_lab_results} Pending Lab {summary.pending_lab_results === 1 ? 'Result' : 'Results'}
                  </p>
                  <p className="text-xs text-yellow-700">Results will be available soon</p>
                </div>
              </div>
            )}
            {summary.upcoming_appointments > 0 && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {summary.upcoming_appointments} Upcoming {summary.upcoming_appointments === 1 ? 'Appointment' : 'Appointments'}
                  </p>
                  <p className="text-xs text-blue-700">Don't forget to attend scheduled visits</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryDashboard;