import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../supabaseClient';
import { 
  Pill, Calendar, Clock, User, Search, Filter, Eye, Edit, Trash2,
  AlertCircle, CheckCircle, XCircle, Plus, RefreshCw, FileText,
  Activity, TrendingUp, Users, Download, Mail, Phone, ChevronLeft,
  ChevronRight, MoreHorizontal, ExternalLink, Copy, Star, Package
} from 'lucide-react';

interface DoctorPrescriptionsProps {
  doctorId: string;
}

interface PrescriptionWithPatient {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  expiry_date: string;
  refills_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    blood_type: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
    address: string;
    phone: string;
  };
}

interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  completedPrescriptions: number;
  uniquePatients: number;
  mostPrescribedMedication: string;
}

interface NewPrescriptionData {
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  expiry_date: string;
  refills_remaining: number;
  status: 'active';
}

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [prescriptionsPerPage] = useState(10);
  const [newPrescription, setNewPrescription] = useState<NewPrescriptionData>({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    prescribed_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    refills_remaining: 0,
    status: 'active'
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (doctorId) {
      loadPrescriptions();
      loadPatients();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  const loadPrescriptions = async () => {
    if (!doctorId || doctorId === '') {
      console.warn('No doctorId provided to loadPrescriptions');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load all prescriptions for the doctor with patient details
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone, date_of_birth, blood_type),
          clinic:clinics(id, clinic_name, address, phone)
        `)
        .eq('doctor_id', doctorId)
        .order('prescribed_date', { ascending: false });

      if (prescriptionsError) {
        console.error('Error loading prescriptions:', prescriptionsError);
        return;
      }

      if (prescriptionsData) {
        setPrescriptions(prescriptionsData);
        calculateStats(prescriptionsData);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      // Load patients that have appointments with this doctor
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patients(id, first_name, last_name, email, phone)
        `)
        .eq('doctor_id', doctorId);

      if (!error && appointmentsData) {
        const uniquePatients = Array.from(
          new Map(appointmentsData.filter(apt => apt.patient).map(apt => [apt.patient.id, apt.patient])).values()
        );
        setPatients(uniquePatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
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
      medicationCount[a] > medicationCount[b] ? a : b, 'None');

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

  const handleCreatePrescription = async () => {
    if (!newPrescription.patient_id || !newPrescription.medication_name || !doctorId) {
      return;
    }

    try {
      setSubmitting(true);
      
      const prescriptionData = {
        ...newPrescription,
        doctor_id: doctorId,
        clinic_id: prescriptions[0]?.clinic_id || '', // Use clinic from existing prescriptions or leave empty
      };

      const { error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData]);

      if (error) {
        console.error('Error creating prescription:', error);
        return;
      }

      // Reload prescriptions
      await loadPrescriptions();
      
      // Reset form
      setNewPrescription({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        prescribed_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        refills_remaining: 0,
        status: 'active'
      });
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updatePrescriptionStatus = async (prescriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error updating prescription:', error);
        return;
      }

      // Reload prescriptions
      await loadPrescriptions();
    } catch (error) {
      console.error('Error updating prescription:', error);
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

  const getStatusConfig = (status: string) => {
    const configs = {
      'active': { 
        class: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Active' 
      },
      'completed': { 
        class: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: CheckCircle, 
        text: 'Completed' 
      },
      'cancelled': { 
        class: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        text: 'Cancelled' 
      },
      'expired': { 
        class: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: AlertCircle, 
        text: 'Expired' 
      }
    };
    return configs[status] || configs.active;
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-1.5">
        <IconComponent className="h-3.5 w-3.5" />
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.class}`}>
          {config.text}
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
          <Skeleton width={250} height={32} />
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
          <p className="text-gray-600 mt-1">Manage patient prescriptions and medication records</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Prescription
          </Button>
          <Button onClick={loadPrescriptions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPrescriptions}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
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
                <Pill className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Patients</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.uniquePatients}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Most Prescribed</p>
                  <p className="text-lg font-bold text-orange-600 truncate" title={stats.mostPrescribedMedication}>
                    {stats.mostPrescribedMedication}
                  </p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
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
                onChange={(e) => setFilterStatus(e.target.value as any)}
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
                  Date Prescribed
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
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
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
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.medication_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Duration: {prescription.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{prescription.dosage}</div>
                        <div className="text-gray-500">{prescription.frequency}</div>
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
                        <Button
                          onClick={() => handleViewDetails(prescription)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {prescription.status === 'active' && (
                          <Button
                            onClick={() => updatePrescriptionStatus(prescription.id, 'completed')}
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedPrescription.medication_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Prescribed on {formatDate(selectedPrescription.prescribed_date)}
                </p>
              </div>
              <div className="ml-auto">
                {getStatusBadge(selectedPrescription.status)}
              </div>
            </div>

            {/* Details Grid */}
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
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dosage</p>
                    <p className="text-sm text-gray-600">{selectedPrescription.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Frequency</p>
                    <p className="text-sm text-gray-600">{selectedPrescription.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">{selectedPrescription.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Refills Remaining</p>
                    <p className="text-sm text-gray-600">{selectedPrescription.refills_remaining}</p>
                  </div>
                  {selectedPrescription.expiry_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expiry Date</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedPrescription.expiry_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {selectedPrescription.instructions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedPrescription.instructions}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedPrescription.status === 'active' && (
                <Button
                  onClick={() => {
                    updatePrescriptionStatus(selectedPrescription.id, 'completed');
                    setShowDetailsModal(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Prescription Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Prescription"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                value={newPrescription.patient_id}
                onChange={(e) => setNewPrescription({...newPrescription, patient_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} - {patient.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
              <Input
                value={newPrescription.medication_name}
                onChange={(e) => setNewPrescription({...newPrescription, medication_name: e.target.value})}
                placeholder="Enter medication name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <Input
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <Input
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                  placeholder="e.g., Twice daily"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <Input
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                  placeholder="e.g., 7 days"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refills Remaining</label>
                <Input
                  type="number"
                  value={newPrescription.refills_remaining}
                  onChange={(e) => setNewPrescription({...newPrescription, refills_remaining: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescribed Date</label>
                <Input
                  type="date"
                  value={newPrescription.prescribed_date}
                  onChange={(e) => setNewPrescription({...newPrescription, prescribed_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={newPrescription.expiry_date}
                  onChange={(e) => setNewPrescription({...newPrescription, expiry_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                value={newPrescription.instructions}
                onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                placeholder="Enter prescription instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setShowCreateModal(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePrescription}
                disabled={submitting || !newPrescription.patient_id || !newPrescription.medication_name}
                className="flex items-center gap-2"
              >
                {submitting ? (
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
    </div>
  );
};

export default DoctorPrescriptions;