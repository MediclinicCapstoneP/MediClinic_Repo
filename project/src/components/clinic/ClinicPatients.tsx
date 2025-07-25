import React, { useState } from 'react';
import { Search, User, Phone, Mail, Calendar, FileText, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

export const ClinicPatients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const mockPatients = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 234-567-8900',
      dateOfBirth: '1988-05-15',
      address: '123 Main Street, Downtown, City 12345',
      bloodType: 'O+',
      allergies: ['Penicillin'],
      lastVisit: '2023-12-20',
      totalVisits: 8,
      upcomingAppointments: 1,
      medicalHistory: [
        {
          date: '2023-12-20',
          diagnosis: 'Annual Checkup',
          doctor: 'Dr. Sarah Johnson',
          notes: 'Patient in good health, all vitals normal'
        },
        {
          date: '2023-08-15',
          diagnosis: 'Flu symptoms',
          doctor: 'Dr. Emily Davis',
          notes: 'Prescribed medication, rest recommended'
        }
      ]
    },
    {
      id: 2,
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1 234-567-8901',
      dateOfBirth: '1995-03-22',
      address: '456 Oak Avenue, Suburbs, City 12346',
      bloodType: 'A+',
      allergies: [],
      lastVisit: '2024-01-10',
      totalVisits: 5,
      upcomingAppointments: 0,
      medicalHistory: [
        {
          date: '2024-01-10',
          diagnosis: 'Follow-up consultation',
          doctor: 'Dr. Sarah Johnson',
          notes: 'Treatment responding well, continue medication'
        }
      ]
    },
    {
      id: 3,
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 234-567-8902',
      dateOfBirth: '1982-11-08',
      address: '789 Pine Street, Eastside, City 12347',
      bloodType: 'B+',
      allergies: ['Shellfish', 'Dust'],
      lastVisit: '2023-11-25',
      totalVisits: 12,
      upcomingAppointments: 2,
      medicalHistory: [
        {
          date: '2023-11-25',
          diagnosis: 'Hypertension Management',
          doctor: 'Dr. Michael Wilson',
          notes: 'Blood pressure controlled, continue current medication'
        }
      ]
    },
    {
      id: 4,
      name: 'Sarah Brown',
      email: 'sarah.brown@email.com',
      phone: '+1 234-567-8903',
      dateOfBirth: '1992-07-14',
      address: '321 Elm Street, Westside, City 12348',
      bloodType: 'AB-',
      allergies: [],
      lastVisit: '2024-01-05',
      totalVisits: 3,
      upcomingAppointments: 1,
      medicalHistory: [
        {
          date: '2024-01-05',
          diagnosis: 'Routine Physical',
          doctor: 'Dr. Sarah Johnson',
          notes: 'Annual physical completed, all results normal'
        }
      ]
    }
  ];

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  const handleViewDetails = (patient: any) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patients</h1>
        <p className="text-gray-600">Manage your clinic's patient database</p>
      </div>

      {/* Search and Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={20} className="text-gray-400" />}
            />
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{mockPatients.length}</p>
              <p>Total Patients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {mockPatients.reduce((acc, patient) => acc + patient.upcomingAppointments, 0)}
              </p>
              <p>Upcoming Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {mockPatients.filter(patient => {
                  const lastVisit = new Date(patient.lastVisit);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return lastVisit > thirtyDaysAgo;
                }).length}
              </p>
              <p>Recent Visits (30 days)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={24} />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{patient.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{patient.totalVisits}</p>
                      <p className="text-xs text-gray-600">Total Visits</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{patient.upcomingAppointments}</p>
                      <p className="text-xs text-gray-600">Upcoming</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Last Visit</p>
                      <p className="text-sm font-medium">{new Date(patient.lastVisit).toLocaleDateString()}</p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <Eye size={16} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Blood Type</p>
                      <p className="font-medium">{patient.bloodType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Allergies</p>
                      <p className="font-medium">
                        {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Address</p>
                      <p className="font-medium">{patient.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Patient Details"
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{selectedPatient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blood Type</p>
                  <p className="font-medium">{selectedPatient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedPatient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedPatient.email}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Address</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedPatient.address}</p>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Medical Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Allergies</p>
                    <p className="font-medium">
                      {selectedPatient.allergies.length > 0 
                        ? selectedPatient.allergies.join(', ')
                        : 'No known allergies'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Visits</p>
                    <p className="font-medium">{selectedPatient.totalVisits}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Medical History</h4>
              <div className="space-y-3">
                {selectedPatient.medicalHistory.map((record: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{record.diagnosis}</h5>
                        <p className="text-sm text-gray-600">{record.doctor}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{record.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button variant="outline">
                <FileText size={16} className="mr-2" />
                View Full History
              </Button>
              <Button>
                Schedule Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};