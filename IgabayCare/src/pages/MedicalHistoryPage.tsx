import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MedicalHistoryService } from '../services/medicalHistoryService';
import { PatientMedicalHistory, HistoryFilters } from '../types/history';
import MedicalHistoryDashboard from '../components/patient/MedicalHistoryDashboard';
import MedicalHistoryTimeline from '../components/patient/MedicalHistoryTimeline';
import { 
  AlertCircle,
  Download,
  Share,
  Settings,
  RefreshCw
} from 'lucide-react';

const MedicalHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [filters, setFilters] = useState<HistoryFilters>({});

  // Get patient ID (you might need to adjust this based on your auth context structure)
  const getPatientId = (): string | null => {
    // This is a placeholder - adjust based on your actual user structure
    return user?.id || null;
  };

  const fetchMedicalHistory = async (showRefreshing = false) => {
    const patientId = getPatientId();
    if (!patientId) {
      setError('Patient ID not found');
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const result = await MedicalHistoryService.getPatientMedicalHistory(patientId, filters);
      
      if (result.success && result.data) {
        setMedicalHistory(result.data);
      } else {
        setError(result.error || 'Failed to fetch medical history');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching medical history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedicalHistory();
  }, [filters]);

  const handleRefresh = () => {
    fetchMedicalHistory(true);
  };

  const handleExportData = () => {
    if (!medicalHistory) return;
    
    const dataStr = JSON.stringify(medicalHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `medical-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShareHistory = async () => {
    if (!medicalHistory) return;
    
    const shareData = {
      title: 'Medical History Summary',
      text: `Medical History Summary:
      - Total Appointments: ${medicalHistory.summary.total_appointments}
      - Active Prescriptions: ${medicalHistory.summary.active_prescriptions}
      - Last Visit: ${medicalHistory.summary.last_visit_date || 'N/A'}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        alert('Medical history summary copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your medical history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Medical History</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchMedicalHistory()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!medicalHistory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Medical History Found</h2>
          <p className="text-gray-600">Your medical history will appear here once you have appointments and medical records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Timeline
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={handleExportData}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={handleShareHistory}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <MedicalHistoryDashboard 
            summary={medicalHistory.summary}
            patientName={user?.email} // Adjust based on your user structure
            loading={false}
          />
        ) : (
          <MedicalHistoryTimeline
            timelineItems={MedicalHistoryService.generateHistoryTimeline(medicalHistory, filters)}
            onFilter={setFilters}
            loading={false}
          />
        )}

        {/* Emergency Information Footer */}
        {(medicalHistory.summary.active_allergies > 0 || medicalHistory.allergies.length > 0) && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Emergency Medical Information
                </h3>
                <div className="text-sm text-red-700">
                  <p className="mb-2">This patient has documented allergies. Please review allergy information before prescribing medications or treatments.</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.allergies
                      .filter(allergy => allergy.is_active)
                      .slice(0, 3)
                      .map((allergy, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                          {allergy.allergen} ({allergy.severity})
                        </span>
                      ))}
                    {medicalHistory.allergies.filter(a => a.is_active).length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                        +{medicalHistory.allergies.filter(a => a.is_active).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This medical history was last updated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="mt-1">
            For questions about your medical records, please contact your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryPage;