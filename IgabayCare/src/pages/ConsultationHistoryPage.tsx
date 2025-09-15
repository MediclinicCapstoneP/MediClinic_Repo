import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConsultationHistoryService, { 
  ConsultationWithDetails, 
  ConsultationHistoryFilters 
} from '../services/consultationHistoryService';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Search,
  Filter,
  Download,
  Share,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
  Stethoscope
} from 'lucide-react';

interface ConsultationStats {
  total_consultations: number;
  completed_consultations: number;
  upcoming_consultations: number;
  cancelled_consultations: number;
  total_consultation_fees: number;
  average_consultation_duration: number;
  consultation_types: Record<string, number>;
  last_consultation_date: string | null;
  next_consultation_date: string | null;
}

const ConsultationHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationWithDetails[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ConsultationHistoryFilters>({});

  // Get user ID and determine if it's a patient or doctor
  const getUserId = (): string | null => {
    return user?.id || null;
  };

  const fetchConsultationHistory = async (showRefreshing = false) => {
    const userId = getUserId();
    if (!userId) {
      setError('User ID not found');
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
      
      // Try to fetch as patient first, then as doctor if no results
      let result = await ConsultationHistoryService.getPatientConsultationHistory(userId, filters);
      
      if (result.success && result.data && result.data.length === 0) {
        // Try as doctor if no patient consultations found
        result = await ConsultationHistoryService.getDoctorConsultationHistory(userId, filters);
      }
      
      if (result.success && result.data) {
        setConsultations(result.data);
        
        // Fetch statistics
        const statsResult = await ConsultationHistoryService.getPatientConsultationStats(userId);
        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } else {
        setError(result.error || 'Failed to fetch consultation history');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching consultation history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultationHistory();
  }, [filters]);

  const handleRefresh = () => {
    fetchConsultationHistory(true);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleExportData = () => {
    if (!consultations.length) return;
    
    const exportData = {
      consultations,
      stats,
      exported_at: new Date().toISOString(),
      user_id: user?.id
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `consultation-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShareHistory = async () => {
    if (!stats) return;
    
    const shareData = {
      title: 'Consultation History Summary',
      text: `Consultation History Summary:
      - Total Consultations: ${stats.total_consultations}
      - Completed: ${stats.completed_consultations}
      - Total Fees: $${stats.total_consultation_fees}
      - Last Consultation: ${stats.last_consultation_date || 'N/A'}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Consultation history summary copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        consultation.chief_complaint.toLowerCase().includes(searchLower) ||
        consultation.diagnosis.toLowerCase().includes(searchLower) ||
        consultation.treatment_plan.toLowerCase().includes(searchLower) ||
        consultation.doctor_notes?.toLowerCase().includes(searchLower) ||
        consultation.doctor?.first_name?.toLowerCase().includes(searchLower) ||
        consultation.doctor?.last_name?.toLowerCase().includes(searchLower) ||
        consultation.clinic?.clinic_name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Consultation History</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Consultation History
            </h1>
            <p className="text-gray-600">
              Track and manage all your medical consultations and appointments
            </p>
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

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Consultations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_consultations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completed_consultations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Fees</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.total_consultation_fees)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.average_consultation_duration}m</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search consultations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className="text-sm text-gray-500">
              Showing {filteredConsultations.length} of {consultations.length} consultations
            </div>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.consultation_status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, consultation_status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consultation List */}
        <div className="space-y-4">
          {filteredConsultations.length > 0 ? (
            filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpanded(consultation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${{
                          completed: 'bg-green-100 text-green-800',
                          in_progress: 'bg-yellow-100 text-yellow-800',
                          scheduled: 'bg-blue-100 text-blue-800',
                          cancelled: 'bg-red-100 text-red-800'
                        }[consultation.consultation_status] || 'bg-gray-100 text-gray-800'}`}>
                          {consultation.consultation_status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {consultation.consultation_type}
                        </span>
                        {consultation.follow_up_required && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Follow-up Required
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {consultation.chief_complaint || 'Consultation'}
                      </h3>
                      
                      {consultation.diagnosis && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Diagnosis:</strong> {consultation.diagnosis}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(consultation.consultation_date)}</span>
                        </div>
                        {consultation.doctor && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{consultation.doctor.first_name} {consultation.doctor.last_name}</span>
                          </div>
                        )}
                        {consultation.clinic && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{consultation.clinic.clinic_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{consultation.duration_minutes} min</span>
                        </div>
                        {consultation.consultation_fee > 0 && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(consultation.consultation_fee)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {expandedItems.has(consultation.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedItems.has(consultation.id) && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="pt-4 space-y-4">
                      {consultation.treatment_plan && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Treatment Plan</h4>
                          <p className="text-sm text-gray-600">{consultation.treatment_plan}</p>
                        </div>
                      )}
                      
                      {consultation.doctor_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Doctor Notes</h4>
                          <p className="text-sm text-gray-600">{consultation.doctor_notes}</p>
                        </div>
                      )}
                      
                      {consultation.patient_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Patient Notes</h4>
                          <p className="text-sm text-gray-600">{consultation.patient_notes}</p>
                        </div>
                      )}

                      {consultation.vital_signs && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Vital Signs</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {consultation.vital_signs.blood_pressure_systolic && (
                              <div>
                                <span className="text-gray-500">BP:</span> {consultation.vital_signs.blood_pressure_systolic}/{consultation.vital_signs.blood_pressure_diastolic}
                              </div>
                            )}
                            {consultation.vital_signs.heart_rate && (
                              <div>
                                <span className="text-gray-500">HR:</span> {consultation.vital_signs.heart_rate} bpm
                              </div>
                            )}
                            {consultation.vital_signs.temperature && (
                              <div>
                                <span className="text-gray-500">Temp:</span> {consultation.vital_signs.temperature}°F
                              </div>
                            )}
                            {consultation.vital_signs.weight && (
                              <div>
                                <span className="text-gray-500">Weight:</span> {consultation.vital_signs.weight} lbs
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                        <span>Updated: {formatDate(consultation.updated_at)}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          consultation.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Payment: {consultation.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No consultation history found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {consultations.length === 0
                  ? "You haven't had any consultations yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This consultation history was last updated on {new Date().toLocaleDateString('en-US', {
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

export default ConsultationHistoryPage;