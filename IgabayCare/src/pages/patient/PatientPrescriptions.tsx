import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { prescriptionService, type PrescriptionWithMedications } from '../../services/prescriptionService';
import { authService } from '../../features/auth/utils/authService';
import { patientService } from '../../features/auth/utils/patientService';
import {
  Pill,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Stethoscope,
  MapPin,
  Info,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Home
} from 'lucide-react';

const PRESCRIPTION_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-orange-100 text-orange-800 border-orange-200'
};

const PRESCRIPTION_STATUS_ICONS = {
  active: <CheckCircle size={16} />,
  completed: <CheckCircle size={16} />,
  cancelled: <XCircle size={16} />,
  expired: <AlertTriangle size={16} />
};

const PatientPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithMedications[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionWithMedications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMedications | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    completed: 0,
    recentCount: 0
  });

  useEffect(() => {
    loadPatientInfo();
    loadPrescriptions();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [prescriptions, searchQuery, statusFilter, dateFilter]);

  const loadPatientInfo = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const result = await patientService.getPatientByUserId(currentUser.id);
        if (result.success && result.patient) {
          setPatientInfo(result.patient);
        }
      }
    } catch (err) {
      console.error('Error loading patient info:', err);
    }
  };

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await prescriptionService.getPatientPrescriptions();
      
      if (result.success && result.prescriptions) {
        setPrescriptions(result.prescriptions);
      } else {
        setError(result.error || 'Failed to load prescriptions');
        setPrescriptions([]);
      }
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      setError('Failed to load prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await prescriptionService.getPrescriptionStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Error loading prescription stats:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prescription => 
        prescription.prescribing_doctor_name.toLowerCase().includes(query) ||
        prescription.diagnosis?.toLowerCase().includes(query) ||
        prescription.prescription_number.toLowerCase().includes(query) ||
        prescription.medications.some(med => 
          med.medication_name.toLowerCase().includes(query)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === statusFilter);
    }

    // Date filter
    if (dateFilter.start) {
      filtered = filtered.filter(prescription => 
        new Date(prescription.prescribed_date) >= new Date(dateFilter.start)
      );
    }
    
    if (dateFilter.end) {
      filtered = filtered.filter(prescription => 
        new Date(prescription.prescribed_date) <= new Date(dateFilter.end)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (prescription: PrescriptionWithMedications) => {
    if (prescription.valid_until) {
      return new Date(prescription.valid_until) < new Date();
    }
    // If no expiry date, check if 30 days have passed since prescription date
    const thirtyDaysAfter = new Date(prescription.prescribed_date);
    thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);
    return thirtyDaysAfter < new Date();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter({ start: '', end: '' });
    setShowFilters(false);
  };

  const goToPatientHome = () => {
    window.location.href = '/patient/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-6"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with navigation and patient info */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPatientHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <Home size={16} className="sm:hidden" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Prescriptions</h1>
              <p className="text-gray-600">
                {patientInfo ? 
                  `${patientInfo.first_name} ${patientInfo.last_name} - View and manage your prescribed medications` :
                  'View and manage your prescribed medications'
                }
              </p>
            </div>
          </div>
          
          <Button
            onClick={loadPrescriptions}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">Expired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.recentCount}</div>
              <div className="text-sm text-gray-600">Recent</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and filter controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by medication, doctor, or diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Filter toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary-50 border-primary-300' : ''}
              >
                <Filter size={16} className="mr-2" />
                Filters
                {(statusFilter !== 'all' || dateFilter.start || dateFilter.end) && (
                  <span className="ml-2 bg-primary-600 text-white rounded-full text-xs px-2 py-1">
                    {[statusFilter !== 'all' ? 1 : 0, dateFilter.start ? 1 : 0, dateFilter.end ? 1 : 0].reduce((a, b) => a + b)}
                  </span>
                )}
              </Button>
            </div>

            {/* Extended filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Prescriptions list */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Pill size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {prescriptions.length === 0 ? 'No prescriptions found' : 'No prescriptions match your filters'}
              </h3>
              <p className="text-gray-600">
                {prescriptions.length === 0
                  ? 'Your prescriptions from completed appointments will appear here.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {prescriptions.length === 0 && (
                <Button className="mt-4" onClick={loadPrescriptions}>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      {/* Prescription header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              RX #{prescription.prescription_number}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                              PRESCRIPTION_STATUS_COLORS[prescription.status]
                            }`}>
                              {PRESCRIPTION_STATUS_ICONS[prescription.status]}
                              {prescription.status.toUpperCase()}
                            </span>
                            {isExpired(prescription) && prescription.status === 'active' && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                EXPIRED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(prescription.prescribed_date)}
                            </div>
                            {prescription.appointment && (
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {prescription.appointment.clinic_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Doctor and diagnosis */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope size={16} className="text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {prescription.prescribing_doctor_name}
                            </div>
                            {prescription.doctor_specialty && (
                              <div className="text-sm text-gray-600">
                                {prescription.doctor_specialty}
                              </div>
                            )}
                          </div>
                        </div>
                        {prescription.diagnosis && (
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">Diagnosis</div>
                              <div className="text-sm text-gray-600">{prescription.diagnosis}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Medications */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Pill size={16} className="text-purple-600" />
                          Prescribed Medications ({prescription.medications.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {prescription.medications.slice(0, 4).map((medication) => (
                            <div
                              key={medication.id}
                              className="p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="font-medium text-gray-900 mb-1">
                                {medication.medication_name}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><strong>Strength:</strong> {medication.strength}</div>
                                <div><strong>Dosage:</strong> {medication.dosage}</div>
                                <div><strong>Frequency:</strong> {medication.frequency}</div>
                                <div><strong>Duration:</strong> {medication.duration}</div>
                                {medication.timing && (
                                  <div><strong>Timing:</strong> {medication.timing}</div>
                                )}
                              </div>
                              {medication.special_instructions && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                                  <Info size={12} className="inline mr-1" />
                                  {medication.special_instructions}
                                </div>
                              )}
                            </div>
                          ))}
                          {prescription.medications.length > 4 && (
                            <div className="p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-sm">
                                +{prescription.medications.length - 4} more medications
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* General instructions */}
                      {prescription.general_instructions && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                            <Info size={16} />
                            General Instructions
                          </h5>
                          <p className="text-blue-800 text-sm">{prescription.general_instructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPrescription(prescription)}
                      >
                        <Eye size={16} className="mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Prescription detail modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Prescription Details - RX #{selectedPrescription.prescription_number}
                </h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Prescription info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Prescription Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Prescription Number:</strong> {selectedPrescription.prescription_number}</div>
                      <div><strong>Date Prescribed:</strong> {formatDate(selectedPrescription.prescribed_date)}</div>
                      <div><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          PRESCRIPTION_STATUS_COLORS[selectedPrescription.status]
                        }`}>
                          {selectedPrescription.status.toUpperCase()}
                        </span>
                      </div>
                      {selectedPrescription.valid_until && (
                        <div><strong>Valid Until:</strong> {formatDate(selectedPrescription.valid_until)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Doctor Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Doctor:</strong> {selectedPrescription.prescribing_doctor_name}</div>
                      {selectedPrescription.doctor_specialty && (
                        <div><strong>Specialty:</strong> {selectedPrescription.doctor_specialty}</div>
                      )}
                      {selectedPrescription.prescribing_doctor_license && (
                        <div><strong>License:</strong> {selectedPrescription.prescribing_doctor_license}</div>
                      )}
                      {selectedPrescription.diagnosis && (
                        <div><strong>Diagnosis:</strong> {selectedPrescription.diagnosis}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Prescribed Medications</h4>
                  <div className="space-y-4">
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={medication.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">
                            {index + 1}. {medication.medication_name}
                          </h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            medication.status === 'active' ? 'bg-green-100 text-green-800' :
                            medication.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {medication.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div><strong>Strength:</strong> {medication.strength}</div>
                            <div><strong>Dosage:</strong> {medication.dosage}</div>
                            <div><strong>Frequency:</strong> {medication.frequency}</div>
                            <div><strong>Duration:</strong> {medication.duration}</div>
                            {medication.timing && <div><strong>Timing:</strong> {medication.timing}</div>}
                          </div>
                          
                          <div className="space-y-1">
                            {medication.generic_name && <div><strong>Generic Name:</strong> {medication.generic_name}</div>}
                            {medication.form && <div><strong>Form:</strong> {medication.form}</div>}
                            <div><strong>Quantity:</strong> {medication.quantity_prescribed}</div>
                            {medication.refills_allowed > 0 && (
                              <div><strong>Refills:</strong> {medication.refills_used}/{medication.refills_allowed}</div>
                            )}
                          </div>
                        </div>
                        
                        {medication.special_instructions && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                            <strong className="text-yellow-800">Special Instructions:</strong>
                            <p className="text-yellow-700 mt-1">{medication.special_instructions}</p>
                          </div>
                        )}
                        
                        {medication.side_effects && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                            <strong className="text-red-800">Possible Side Effects:</strong>
                            <p className="text-red-700 mt-1">{medication.side_effects}</p>
                          </div>
                        )}
                        
                        {medication.precautions && (
                          <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                            <strong className="text-orange-800">Precautions:</strong>
                            <p className="text-orange-700 mt-1">{medication.precautions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions and notes */}
                {(selectedPrescription.general_instructions || selectedPrescription.dietary_restrictions || selectedPrescription.follow_up_instructions || selectedPrescription.clinical_notes) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                    <div className="space-y-3">
                      {selectedPrescription.general_instructions && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-900">General Instructions:</strong>
                          <p className="text-blue-800 mt-1">{selectedPrescription.general_instructions}</p>
                        </div>
                      )}
                      
                      {selectedPrescription.dietary_restrictions && (
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <strong className="text-orange-900">Dietary Restrictions:</strong>
                          <p className="text-orange-800 mt-1">{selectedPrescription.dietary_restrictions}</p>
                        </div>
                      )}
                      
                      {selectedPrescription.follow_up_instructions && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <strong className="text-green-900">Follow-up Instructions:</strong>
                          <p className="text-green-800 mt-1">{selectedPrescription.follow_up_instructions}</p>
                        </div>
                      )}
                      
                      {selectedPrescription.clinical_notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <strong className="text-gray-900">Clinical Notes:</strong>
                          <p className="text-gray-800 mt-1">{selectedPrescription.clinical_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPrescription(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // TODO: Implement print/download functionality
                      alert('Print/Download functionality will be implemented');
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptionsPage;