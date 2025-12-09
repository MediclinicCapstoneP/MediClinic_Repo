import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import { prescriptionService, PrescriptionWithPatient } from '../../features/auth/utils/prescriptionService';
import { 
  Pill, Calendar, Clock, User, Search, Filter, Eye,
  AlertCircle, CheckCircle, XCircle, Plus, RefreshCw, FileText,
  Activity, TrendingUp, Users, Mail, Phone
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface DoctorPrescriptionsProps {
  doctorId: string;
}

interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  completedPrescriptions: number;
  uniquePatients: number;
  mostPrescribedMedication: string;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
}

interface NewPrescriptionFormState {
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  expiry_date: string;
  refills_remaining: number;
}

const createEmptyPrescription = (): NewPrescriptionFormState => ({
  patient_id: '',
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
  prescribed_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  refills_remaining: 0,
});

export const DoctorPrescriptions: React.FC<DoctorPrescriptionsProps> = ({ doctorId }) => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [stats, setStats] = useState<PrescriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'expired'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithPatient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [prescriptionsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newPrescription, setNewPrescription] = useState<NewPrescriptionFormState>(createEmptyPrescription());
  const [doctorClinicId, setDoctorClinicId] = useState<string>('');

  useEffect(() => {
    if (doctorId) {
      loadPrescriptions();
      loadPatients();
      loadDoctorClinic();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  const loadPrescriptions = async () => {
    if (!doctorId || doctorId === '') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await prescriptionService.getPrescriptionsByDoctor(doctorId);

      if (result.success && result.prescriptions) {
        setPrescriptions(result.prescriptions);
        calculateStats(result.prescriptions);
        if (!doctorClinicId && result.prescriptions.length > 0) {
          const existingClinicId = result.prescriptions.find(p => p.clinic_id)?.clinic_id;
          if (existingClinicId) {
            setDoctorClinicId(existingClinicId);
          }
        }
      } else {
        console.error('Error loading prescriptions:', result.error);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient:patients(id, first_name, last_name, email)
        `)
        .eq('doctor_id', doctorId)
        .not('patient', 'is', null);

      if (error) {
        console.error('Error loading patients for prescriptions:', error);
        return;
      }

      type AppointmentPatientRow = { patient: PatientOption | null };
      const rows = (((data ?? []) as unknown) as AppointmentPatientRow[]);

      const uniquePatientsMap = new Map<string, PatientOption>();
      rows.forEach(({ patient }) => {
        if (patient?.id) {
          uniquePatientsMap.set(patient.id, {
            id: patient.id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
          });
        }
      });

      setPatients(Array.from(uniquePatientsMap.values()).sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }));
    } catch (error) {
      console.error('Error loading patients for prescriptions:', error);
    }
  };

  const loadDoctorClinic = async () => {
    if (!doctorId || doctorClinicId) return doctorClinicId;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('clinic_id')
        .eq('id', doctorId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching doctor clinic id:', error);
        return '';
      }

      if (data?.clinic_id) {
        setDoctorClinicId(data.clinic_id);
        return data.clinic_id as string;
      }
    } catch (error) {
      console.error('Error loading doctor clinic id:', error);
    }

    return '';
  };

  const calculateStats = (prescriptionList: PrescriptionWithPatient[]) => {
    const total = prescriptionList.length;
    const active = prescriptionList.filter(p => p.status === 'active').length;
    const expired = prescriptionList.filter(p => p.status === 'expired').length;
    const completed = prescriptionList.filter(p => p.status === 'completed').length;

    
    const uniquePatients = new Set(prescriptionList.map(p => p.patient_id)).size;
    
    // Find most prescribed medication
    const medicationCount: { [key: string]: number } = {};
    prescriptionList.forEach(p => {
      medicationCount[p.medication_name] = (medicationCount[p.medication_name] || 0) + 1;
    });
    
    const mostPrescribedMedication = Object.keys(medicationCount).reduce((a, b) => 
      medicationCount[a] > medicationCount[b] ? a : b, '');

    setStats({
      totalPrescriptions: total,
      activePrescriptions: active,
      expiredPrescriptions: expired,
      completedPrescriptions: completed,
      uniquePatients,
      mostPrescribedMedication
    });
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.medication_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.patient?.first_name?.toLowerCase() + ' ' + p.patient?.last_name?.toLowerCase()).includes(searchQuery.toLowerCase()) ||
        p.patient?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.instructions?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(p => p.prescribed_date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(p => p.prescribed_date <= filterDateTo);
    }

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  };

  const handleViewDetails = (prescription: PrescriptionWithPatient) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleCompletePrescription = async (prescription: PrescriptionWithPatient) => {
    if (!confirm('Are you sure you want to mark this prescription as completed?')) {
      return;
    }

    try {
      setActionLoading(prescription.id);
      const result = await prescriptionService.updatePrescriptionStatus(prescription.id, 'completed');
      
      if (result.success) {
        // Refresh prescriptions list
        loadPrescriptions();
        alert('Prescription marked as completed successfully.');
      } else {
        alert('Error completing prescription: ' + result.error);
      }
    } catch (error) {
      console.error('Error completing prescription:', error);
      alert('Error completing prescription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedulePrescription = (prescription: PrescriptionWithPatient) => {
    setSelectedPrescription(prescription);
    setShowRescheduleModal(true);
  };

  const handleCreateNewPrescription = () => {
    setCreateError(null);
    setNewPrescription(createEmptyPrescription());
    setShowCreateModal(true);
  };

  const closeCreatePrescriptionModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
    setNewPrescription(createEmptyPrescription());
  };

  const handleNewPrescriptionChange = <K extends keyof NewPrescriptionFormState>(field: K, value: NewPrescriptionFormState[K]) => {
    setNewPrescription((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitNewPrescription = async () => {
    if (!doctorId) {
      setCreateError('Doctor information is missing. Please try again later.');
      return;
    }

    if (!newPrescription.patient_id || !newPrescription.medication_name || !newPrescription.dosage || !newPrescription.frequency || !newPrescription.duration) {
      setCreateError('Please fill in all required fields before creating the prescription.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      let clinicId = doctorClinicId;
      if (!clinicId) {
        clinicId = await loadDoctorClinic();
      }

      if (!clinicId) {
        setCreateError('Unable to determine your clinic. Please update your profile or contact support.');
        return;
      }

      const result = await prescriptionService.createPrescription({
        patient_id: newPrescription.patient_id,
        doctor_id: doctorId,
        clinic_id: clinicId,
        medication_name: newPrescription.medication_name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        instructions: newPrescription.instructions || undefined,
        prescribed_date: newPrescription.prescribed_date,
        expiry_date: newPrescription.expiry_date || undefined,
        refills_remaining: newPrescription.refills_remaining,
        status: 'active',
      });

      if (!result.success) {
        setCreateError(result.error || 'Failed to create prescription. Please try again.');
        return;
      }

      await loadPrescriptions();
      closeCreatePrescriptionModal();
    } catch (error) {
      console.error('Error creating prescription:', error);
      setCreateError('Unexpected error creating prescription. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { class: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { class: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <div className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setShowFilters(false);
  };

  // Pagination
  const indexOfLastPrescription = currentPage * prescriptionsPerPage;
  const indexOfFirstPrescription = indexOfLastPrescription - prescriptionsPerPage;
  const currentPrescriptions = filteredPrescriptions.slice(indexOfFirstPrescription, indexOfLastPrescription);
  const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width={200} height={32} />
          <div className="flex gap-2">
            <Skeleton width={120} height={40} />
            <Skeleton width={100} height={40} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton width="100%" height={80} />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (!doctorId || doctorId === '') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
        </div>
        
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Doctor Profile</h3>
          <p className="text-gray-600">
            Please wait while we load your doctor profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
          <p className="text-gray-600 mt-1">Manage all prescriptions you've created for your patients</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateNewPrescription}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Prescription
          </Button>
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={loadPrescriptions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPrescriptions}</p>
                </div>
                <Pill className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activePrescriptions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completedPrescriptions}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.uniquePatients}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiredPrescriptions}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most Prescribed Medication */}
      {stats?.mostPrescribedMedication && (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Most Prescribed Medication</p>
                <p className="text-lg font-semibold text-purple-600">{stats.mostPrescribedMedication}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search prescriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              
              <Input
                type="date"
                placeholder="From Date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
              
              <Input
                type="date"
                placeholder="To Date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage & Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescribed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                    <p className="text-gray-600">
                      {searchQuery || filterStatus !== 'all' || filterDateFrom || filterDateTo
                        ? 'Try adjusting your search filters.'
                        : 'You haven\'t created any prescriptions yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                currentPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {prescription.patient ? 
                              `${prescription.patient.first_name} ${prescription.patient.last_name}` : 
                              'Unknown Patient'}
                          </div>
                          {prescription.patient?.email && (
                            <div className="text-sm text-gray-500">
                              {prescription.patient.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.medication_name}
                        </div>
                        {prescription.duration && (
                          <div className="text-sm text-gray-500">
                            Duration: {prescription.duration}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.dosage}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.frequency}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(prescription.prescribed_date)}
                      </div>
                      {prescription.expiry_date && (
                        <div className="text-sm text-gray-500">
                          Expires: {formatDate(prescription.expiry_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(prescription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {prescription.status === 'active' && (
                          <Button
                            onClick={() => handleCompletePrescription(prescription)}
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            disabled={actionLoading === prescription.id}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {actionLoading === prescription.id ? 'Loading...' : 'Complete'}
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleReschedulePrescription(prescription)}
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Reschedule
                        </Button>
                        
                        <Button
                          onClick={() => handleViewDetails(prescription)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstPrescription + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastPrescription, filteredPrescriptions.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredPrescriptions.length}</span> results
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Prescription Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedPrescription.medication_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Prescribed on {formatDate(selectedPrescription.prescribed_date)}
                </p>
              </div>
              <div>
                {getStatusBadge(selectedPrescription.status)}
              </div>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Patient Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Name</p>
                      <p className="text-sm text-gray-600">
                        {selectedPrescription.patient ? 
                          `${selectedPrescription.patient.first_name} ${selectedPrescription.patient.last_name}` : 
                          'Unknown Patient'}
                      </p>
                    </div>
                  </div>
                  {selectedPrescription.patient?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{selectedPrescription.patient.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedPrescription.patient?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{selectedPrescription.patient.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Prescription Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Pill className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Medication</p>
                      <p className="text-sm text-gray-600">{selectedPrescription.medication_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dosage</p>
                      <p className="text-sm text-gray-600">{selectedPrescription.dosage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Frequency</p>
                      <p className="text-sm text-gray-600">{selectedPrescription.frequency}</p>
                    </div>
                  </div>
                  {selectedPrescription.duration && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Duration</p>
                        <p className="text-sm text-gray-600">{selectedPrescription.duration}</p>
                      </div>
                    </div>
                  )}
                  {selectedPrescription.refills_remaining !== undefined && (
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Refills Remaining</p>
                        <p className="text-sm text-gray-600">{selectedPrescription.refills_remaining}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {selectedPrescription.instructions && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Instructions</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedPrescription.instructions}</p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Prescribed Date</p>
                <p className="text-sm text-gray-600">{formatDate(selectedPrescription.prescribed_date)}</p>
              </div>
              {selectedPrescription.expiry_date && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Expiry Date</p>
                  <p className="text-sm text-gray-600">{formatDate(selectedPrescription.expiry_date)}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Prescription Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={closeCreatePrescriptionModal}
          title="Create New Prescription"
          size="lg"
        >
          <div className="space-y-6 p-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Plus className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">New Prescription</h3>
                  <p className="text-blue-700">Fill out the form below to prescribe medication to a patient.</p>
                </div>
              </div>
            </div>

            {createError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient<span className="text-red-500">*</span></label>
                <select
                  value={newPrescription.patient_id}
                  onChange={(e) => handleNewPrescriptionChange('patient_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.length === 0 && <option disabled>No patients found for your appointments</option>}
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}{patient.email ? ` - ${patient.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name<span className="text-red-500">*</span></label>
                <Input
                  value={newPrescription.medication_name}
                  onChange={(e) => handleNewPrescriptionChange('medication_name', e.target.value)}
                  placeholder="e.g., Amoxicillin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage<span className="text-red-500">*</span></label>
                <Input
                  value={newPrescription.dosage}
                  onChange={(e) => handleNewPrescriptionChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency<span className="text-red-500">*</span></label>
                <Input
                  value={newPrescription.frequency}
                  onChange={(e) => handleNewPrescriptionChange('frequency', e.target.value)}
                  placeholder="e.g., Twice daily"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration<span className="text-red-500">*</span></label>
                <Input
                  value={newPrescription.duration}
                  onChange={(e) => handleNewPrescriptionChange('duration', e.target.value)}
                  placeholder="e.g., 7 days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refills Remaining</label>
                <Input
                  type="number"
                  min={0}
                  value={newPrescription.refills_remaining}
                  onChange={(e) => handleNewPrescriptionChange('refills_remaining', Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescribed Date<span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={newPrescription.prescribed_date}
                  onChange={(e) => handleNewPrescriptionChange('prescribed_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={newPrescription.expiry_date}
                  onChange={(e) => handleNewPrescriptionChange('expiry_date', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={newPrescription.instructions}
                  onChange={(e) => handleNewPrescriptionChange('instructions', e.target.value)}
                  rows={3}
                  placeholder="Add any specific instructions for the patient..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={closeCreatePrescriptionModal} disabled={createLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitNewPrescription} disabled={createLoading} className="flex items-center gap-2">
                {createLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Prescription
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Prescription Modal */}
      {showRescheduleModal && selectedPrescription && (
        <Modal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          title="Reschedule Prescription Follow-up"
          size="md"
        >
          <div className="space-y-6 p-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Reschedule Follow-up</h3>
                  <p className="text-orange-700">Schedule a follow-up for {selectedPrescription.medication_name}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {selectedPrescription.patient ? 
                      `${selectedPrescription.patient.first_name} ${selectedPrescription.patient.last_name}` : 
                      'Unknown Patient'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedPrescription.patient?.email}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Time
                </label>
                <Input
                  type="time"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Follow-up
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select reason</option>
                  <option value="medication_review">Medication Review</option>
                  <option value="progress_check">Progress Check</option>
                  <option value="side_effects">Check for Side Effects</option>
                  <option value="dosage_adjustment">Dosage Adjustment</option>
                  <option value="prescription_renewal">Prescription Renewal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes for the follow-up appointment..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                Cancel
              </Button>
              <Button disabled>
                Schedule Follow-up (Coming Soon)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
