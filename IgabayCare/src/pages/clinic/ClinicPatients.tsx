import React, { useState, useEffect } from 'react';
import { User, Search, Filter, MoreHorizontal, Phone, Mail, Calendar, FileText, Eye, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { clinicDashboardService, type PatientRecord } from '../../features/auth/utils/clinicDashboardService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService } from '../../features/auth/utils/clinicService';

export const ClinicPatients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Fetch clinic patients data
  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        setLoading(true);
        
        // Get current user and clinic ID
        const currentUser = await roleBasedAuthService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'clinic') {
          return;
        }

        const clinicResult = await clinicService.getClinicByUserId(currentUser.user.id);
        if (clinicResult.success && clinicResult.clinic) {
          const clinicId = clinicResult.clinic.id;
          setClinicId(clinicId);

          // Fetch patients
          const patientsResult = await clinicDashboardService.getClinicPatients(clinicId);
          if (patientsResult.success && patientsResult.patients) {
            setPatients(patientsResult.patients);
          }
        }
      } catch (error) {
        console.error('Error fetching patients data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsData();
  }, []);

  const filters = [
    { id: 'all', label: 'All Patients' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'has-appointment', label: 'Has Appointment' },
    { id: 'no-appointment', label: 'No Appointment' }
  ];

  const filteredPatients = patients.filter(patient => {
    const patientName = `${patient.first_name} ${patient.last_name}`;
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         patient.status === selectedFilter ||
                         (selectedFilter === 'has-appointment' && patient.nextAppointment) ||
                         (selectedFilter === 'no-appointment' && !patient.nextAppointment);
    return matchesSearch && matchesFilter;
  });

  const handleViewPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  // Helper function to calculate age
  const calculateAge = (dateOfBirth: string | undefined): number => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Registered Patients</h1>
        <p className="text-gray-600">View and manage patient records and information</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search patients by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filters.map(filter => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patients found</p>
              <p className="text-sm">Patients will appear here after they book appointments with your clinic.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => {
            const patientAge = calculateAge(patient.date_of_birth);
            const patientName = `${patient.first_name} ${patient.last_name}`;
            
            return (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patientName}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User size={16} />
                            <span>{patientAge > 0 ? `${patientAge} years old` : 'Age unknown'} • {patient.gender || 'Gender not specified'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone size={16} />
                            <span>{patient.phone || 'No phone number'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail size={16} />
                            <span>{patient.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} />
                            <span>Last visit: {patient.lastVisit || 'No visits yet'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm text-gray-700">
                            <strong>Primary Doctor:</strong> {patient.primaryDoctor || 'Not assigned'}
                          </p>
                          {patient.nextAppointment && (
                            <p className="text-sm text-blue-600">
                              <strong>Next Appointment:</strong> {new Date(patient.nextAppointment).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <Eye size={16} className="mr-1" />
                        View Details
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{calculateAge(selectedPatient.date_of_birth)} years old</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium">{selectedPatient.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedPatient.status)}`}>
                    {selectedPatient.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedPatient.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedPatient.email}</p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Medical Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Medical History</h5>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedPatient.medical_history.map((condition: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700">• {condition}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No medical history recorded</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Allergies</h5>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedPatient.allergies.map((allergy: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700">• {allergy}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No allergies recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Appointment Information</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Primary Doctor</p>
                  <p className="font-medium">{selectedPatient.primaryDoctor || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="font-medium">{selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString() : 'No visits yet'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Appointment</p>
                  <p className="font-medium">
                    {selectedPatient.nextAppointment ? new Date(selectedPatient.nextAppointment).toLocaleDateString() : 'No upcoming appointments'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emergency Contact</p>
                  <p className="font-medium">
                    {selectedPatient.emergency_contact_name && selectedPatient.emergency_contact_phone 
                      ? `${selectedPatient.emergency_contact_name} (${selectedPatient.emergency_contact_phone})`
                      : 'Not provided'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowPatientModal(false)}>
                Close
              </Button>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                View Medical Records
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 