import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  BarChart3, 
  Shield, 
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  FileCheck,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

export const ManageClinic: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const managementSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Clinic performance and statistics'
    },
  
    {
      id: 'schedule',
      label: 'Schedule Management',
      icon: Calendar,
      description: 'Operating hours and availability'
    },
    {
      id: 'services',
      label: 'Services & Specialties',
      icon: FileText,
      description: 'Medical services and specialties offered'
    },

 
  ];

  const clinicStats = {
    totalPatients: 1247,
    totalDoctors: 8,
    totalStaff: 24,
    averageRating: 4.8,
    monthlyAppointments: 320,
  };

  

  const operatingHours = {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: false }
  };

  const services = [
    { id: 1, name: 'Primary Care', active: true, category: 'General' },
    { id: 2, name: 'Cardiology', active: true, category: 'Specialty' },
    { id: 3, name: 'Pediatrics', active: true, category: 'Specialty' },
    { id: 4, name: 'Dermatology', active: false, category: 'Specialty' },
    { id: 5, name: 'Laboratory Services', active: true, category: 'Diagnostic' },
    { id: 6, name: 'Radiology', active: true, category: 'Diagnostic' }
  ];

  const licenses = [
    { id: 1, name: 'Medical License', number: 'MD-12345', expiry: '2025-12-31', status: 'valid' },
    { id: 2, name: 'Clinic Accreditation', number: 'ACC-2024-001', expiry: '2026-06-30', status: 'valid' },
    { id: 3, name: 'Insurance Provider', number: 'INS-789', expiry: '2024-08-15', status: 'expiring' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'on-leave':
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'valid':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'on-leave':
      case 'expiring':
        return <AlertCircle size={16} className="text-yellow-600" />;
      case 'inactive':
      case 'expired':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{clinicStats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

     

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{clinicStats.monthlyAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{clinicStats.averageRating}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{clinicStats.totalStaff}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => { setModalType('add-staff'); setShowModal(true); }}>
              <Users className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
            <Button variant="outline" onClick={() => { setModalType('update-hours'); setShowModal(true); }}>
              <Clock className="h-4 w-4 mr-2" />
              Update Hours
            </Button>
            <Button variant="outline" onClick={() => { setModalType('add-service'); setShowModal(true); }}>
              <FileText className="h-4 w-4 mr-2" />
              Add Service
            </Button>
            <Button variant="outline" onClick={() => { setModalType('upload-license'); setShowModal(true); }}>
              <FileCheck className="h-4 w-4 mr-2" />
              Upload License
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  

  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
        <Button onClick={() => { setModalType('update-hours'); setShowModal(true); }}>
          <Clock className="h-4 w-4 mr-2" />
          Update Hours
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {Object.entries(operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="w-20 font-medium text-gray-900 capitalize">{day}</span>
                  {hours.closed ? (
                    <span className="text-red-600 font-medium">Closed</span>
                  ) : (
                    <span className="text-gray-600">
                      {hours.open} - {hours.close}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Services & Specialties</h3>
        <Button onClick={() => { setModalType('add-service'); setShowModal(true); }}>
          <FileText className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(service.active ? 'active' : 'inactive')}`}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

 


  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
    
      case 'schedule':
        return renderSchedule();
      case 'services':
        return renderServices();
      
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Clinic</h1>
        <p className="text-gray-600">Comprehensive clinic management and administration</p>
      </div>

      {/* Management Navigation */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {managementSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeSection === section.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">{section.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg">
        {renderContent()}
      </div>

      {/* Modal for various actions */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {modalType === 'add-staff' && 'Add a new staff member to your clinic.'}
            {modalType === 'update-hours' && 'Update your clinic operating hours.'}
            {modalType === 'add-service' && 'Add a new medical service or specialty.'}
            {modalType === 'upload-license' && 'Upload a new license or certification.'}
            {modalType === 'add-insurance' && 'Add a new insurance provider.'}
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 