import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { doctorPatientRecordsService, type PatientRecord as EnhancedPatientRecord, type PatientStats as EnhancedPatientStats } from '../../services/doctorPatientRecordsService';
import { 
  User, Search, Filter, Eye, Calendar, Phone, MapPin,
  AlertTriangle, Heart, Activity,
  Users, TrendingUp, RefreshCw
} from 'lucide-react';

interface DoctorPatientRecordsProps {
  doctorId: string;
}

// Use enhanced interfaces from the service
type PatientRecord = EnhancedPatientRecord;
type PatientStats = EnhancedPatientStats;

export const DoctorPatientRecords: React.FC<DoctorPatientRecordsProps> = ({ doctorId }) => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientRecord[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(12);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [ageRangeFilter, setAgeRangeFilter] = useState({ min: 0, max: 100 });
  const [allergiesFilter, setAllergiesFilter] = useState<boolean | undefined>(undefined);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'active' | 'inactive' | undefined>(undefined);

  useEffect(() => {
    if (doctorId) {
      loadPatientRecords();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery]);

  const loadPatientRecords = async () => {
    if (!doctorId || doctorId === '') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the enhanced service to get patients with comprehensive data
      const filters = {
        searchQuery,
        ...(bloodTypeFilter && { bloodType: bloodTypeFilter }),
        ...(allergiesFilter !== undefined && { hasAllergies: allergiesFilter }),
        ...(appointmentStatusFilter && { appointmentStatus: appointmentStatusFilter }),
        ...(ageRangeFilter.min > 0 || ageRangeFilter.max < 100 ? { ageRange: ageRangeFilter } : {})
      };
      
      const patientsResult = await doctorPatientRecordsService.getDoctorPatients(doctorId, filters);
      
      if (patientsResult.success && patientsResult.patients) {
        setPatients(patientsResult.patients);
        
        // Calculate stats using the enhanced service
        const statsResult = await doctorPatientRecordsService.calculatePatientStats(doctorId);
        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } else {
        console.error('Error loading patients:', patientsResult.error);
      }
    } catch (error) {
      console.error('Error loading patient records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats are now calculated by the service, so this function is no longer needed
  // const calculateStats = ... (removed)

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchQuery) {
      filtered = filtered.filter(patient => 
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.includes(searchQuery) ||
        patient.medical_conditions?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.allergies?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const handleViewDetails = async (patient: PatientRecord) => {
    setSelectedPatient(patient);
    
    // Load patient's appointments and prescriptions using the enhanced service
    try {
      const appointmentsResult = await doctorPatientRecordsService.getPatientAppointments(patient.id, doctorId);
      if (appointmentsResult.success && appointmentsResult.appointments) {
        setPatientAppointments(appointmentsResult.appointments);
      }

      const prescriptionsResult = await doctorPatientRecordsService.getPatientPrescriptions(patient.id, doctorId);
      if (prescriptionsResult.success && prescriptionsResult.prescriptions) {
        setPatientPrescriptions(prescriptionsResult.prescriptions);
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
    
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setBloodTypeFilter('');
    setAgeRangeFilter({ min: 0, max: 100 });
    setAllergiesFilter(undefined);
    setAppointmentStatusFilter(undefined);
    setShowFilters(false);
    loadPatientRecords();
  };


  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton width="100%" height={120} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!doctorId || doctorId === '') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
        </div>
        
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
          <p className="text-gray-600 mt-1">View and manage all your patients' information</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Search
          </Button>
          <Button onClick={loadPatientRecords} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activePatients}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.newPatientsThisMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Age</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.averageAge}</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Common Blood</p>
                  <p className="text-2xl font-bold text-red-600">{stats.mostCommonBloodType}</p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Allergies</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.patientsWithAllergies}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search patients by name, email, phone, conditions, or allergies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blood Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    value={bloodTypeFilter}
                    onChange={(e) => setBloodTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Blood Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Age Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={ageRangeFilter.min || ''}
                      onChange={(e) => setAgeRangeFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={ageRangeFilter.max === 100 ? '' : ageRangeFilter.max}
                      onChange={(e) => setAgeRangeFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Allergies Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <select
                    value={allergiesFilter === undefined ? '' : allergiesFilter.toString()}
                    onChange={(e) => setAllergiesFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Patients</option>
                    <option value="true">With Allergies</option>
                    <option value="false">No Allergies</option>
                  </select>
                </div>

                {/* Activity Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Status</label>
                  <select
                    value={appointmentStatusFilter || ''}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value as 'active' | 'inactive' | undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Patients</option>
                    <option value="active">Active (Recent Appointments)</option>
                    <option value="inactive">Inactive (No Recent Appointments)</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={loadPatientRecords} variant="primary" size="sm">
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPatients.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try adjusting your search query.'
                  : 'You don\'t have any patients yet.'}
              </p>
            </Card>
          </div>
        ) : (
          currentPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                {/* Patient Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {patient.profile_pic_url ? (
                      <img 
                        src={patient.profile_pic_url} 
                        alt={`${patient.first_name} ${patient.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    {patient.age && (
                      <p className="text-sm text-gray-500">{patient.age} years old</p>
                    )}
                  </div>
                </div>

                {/* Patient Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">Appointments</p>
                    <p className="text-lg font-bold text-blue-900">{patient.totalAppointments || 0}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-600">Active Rx</p>
                    <p className="text-lg font-bold text-green-900">{patient.activePrescriptions || 0}</p>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="space-y-2 mb-4">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.blood_type && patient.blood_type !== 'None' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Heart className="h-3 w-3" />
                      <span>Blood Type: {patient.blood_type}</span>
                    </div>
                  )}
                  {patient.allergies && patient.allergies !== 'None' && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="truncate" title={patient.allergies}>
                        Allergies: {patient.allergies.length > 30 ? patient.allergies.substring(0, 30) + '...' : patient.allergies}
                      </span>
                    </div>
                  )}
                </div>

                {/* Appointment Info */}
                {(patient.lastAppointment || patient.nextAppointment) && (
                  <div className="space-y-2 mb-4 p-2 bg-gray-50 rounded-lg">
                    {patient.lastAppointment && (
                      <p className="text-xs text-gray-600">
                        Last visit: {formatDate(patient.lastAppointment)}
                      </p>
                    )}
                    {patient.nextAppointment && (
                      <p className="text-xs text-gray-600">
                        Next visit: {formatDate(patient.nextAppointment)}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  onClick={() => handleViewDetails(patient)}
                  className="w-full"
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View Full Record
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({filteredPatients.length} patients)
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Complete Patient Record"
          size="xl"
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Patient Header */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {selectedPatient.profile_pic_url ? (
                  <img 
                    src={selectedPatient.profile_pic_url} 
                    alt={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h3>
                <p className="text-gray-600">{selectedPatient.email}</p>
                {selectedPatient.age && (
                  <p className="text-gray-500">{selectedPatient.age} years old</p>
                )}
              </div>
            </div>

            {/* Patient Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Personal Information</h4>
                <div className="space-y-3">
                  {selectedPatient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedPatient.date_of_birth)}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">{selectedPatient.address}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.emergency_contact && (
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Emergency Contact</p>
                        <p className="text-sm text-gray-600">{selectedPatient.emergency_contact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Medical Information</h4>
                <div className="space-y-3">
                  {selectedPatient.blood_type && (
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Blood Type</p>
                        <p className="text-sm text-gray-600">{selectedPatient.blood_type}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Statistics</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-600">Total Appointments</p>
                        <p className="text-lg font-bold text-blue-900">{selectedPatient.totalAppointments || 0}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-sm font-medium text-green-600">Active Prescriptions</p>
                        <p className="text-lg font-bold text-green-900">{selectedPatient.activePrescriptions || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            {(selectedPatient.allergies || selectedPatient.medical_conditions || selectedPatient.medications) && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Medical History</h4>
                
                {selectedPatient.allergies && selectedPatient.allergies !== 'None' && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-2">Allergies</h5>
                    <p className="text-sm text-red-700">{selectedPatient.allergies}</p>
                  </div>
                )}
                
                {selectedPatient.medical_conditions && selectedPatient.medical_conditions !== 'None' && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-2">Medical Conditions</h5>
                    <p className="text-sm text-orange-700">{selectedPatient.medical_conditions}</p>
                  </div>
                )}
                
                {selectedPatient.medications && selectedPatient.medications !== 'None' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Current Medications</h5>
                    <p className="text-sm text-blue-700">{selectedPatient.medications}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Appointments */}
            {patientAppointments.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recent Appointments</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patientAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.appointment_date)}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.appointment_type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Prescriptions */}
            {patientPrescriptions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recent Prescriptions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patientPrescriptions.slice(0, 5).map((prescription, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prescription.medication_name}</p>
                        <p className="text-sm text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};