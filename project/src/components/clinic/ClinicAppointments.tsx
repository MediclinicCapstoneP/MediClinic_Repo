import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

export const ClinicAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const mockAppointments = [
    {
      id: 1,
      time: '09:00',
      patient: {
        name: 'John Smith',
        phone: '+1 234-567-8900',
        email: 'john.smith@email.com',
        age: 35,
        reason: 'Annual checkup'
      },
      doctor: 'Dr. Sarah Johnson',
      type: 'Consultation',
      status: 'confirmed',
      duration: 30,
      fee: 150,
      notes: 'Patient reports feeling healthy, wants routine checkup'
    },
    {
      id: 2,
      time: '09:30',
      patient: {
        name: 'Emily Davis',
        phone: '+1 234-567-8901',
        email: 'emily.davis@email.com',
        age: 28,
        reason: 'Follow-up consultation'
      },
      doctor: 'Dr. Sarah Johnson',
      type: 'Follow-up',
      status: 'in-progress',
      duration: 20,
      fee: 100,
      notes: 'Following up on previous visit results'
    },
    {
      id: 3,
      time: '10:00',
      patient: {
        name: 'Michael Chen',
        phone: '+1 234-567-8902',
        email: 'michael.chen@email.com',
        age: 42,
        reason: 'Chest pain evaluation'
      },
      doctor: 'Dr. Michael Wilson',
      type: 'Urgent Care',
      status: 'waiting',
      duration: 45,
      fee: 200,
      notes: 'Patient experiencing intermittent chest pain'
    },
    {
      id: 4,
      time: '10:30',
      patient: {
        name: 'Sarah Brown',
        phone: '+1 234-567-8903',
        email: 'sarah.brown@email.com',
        age: 31,
        reason: 'Routine physical'
      },
      doctor: 'Dr. Michael Wilson',
      type: 'Physical Exam',
      status: 'confirmed',
      duration: 30,
      fee: 150,
      notes: 'Annual physical examination'
    }
  ];

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleMarkComplete = (appointmentId: number) => {
    // TODO: Update appointment status in Supabase
    console.log('Marking appointment as complete:', appointmentId);
  };

  const handleCancelAppointment = (appointmentId: number) => {
    // TODO: Cancel appointment in Supabase
    console.log('Cancelling appointment:', appointmentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your clinic's appointment schedule</p>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar size={20} className="text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                {mockAppointments.length} appointments scheduled
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {mockAppointments.map((appointment) => (
          <Card key={appointment.id} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{appointment.time}</div>
                    <div className="text-xs text-gray-500">{appointment.duration} min</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.patient.name}
                      </h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User size={16} />
                        <span>Age: {appointment.patient.age} • {appointment.doctor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={16} />
                        <span>{appointment.patient.phone}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <strong>Reason:</strong> {appointment.patient.reason}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Type:</strong> {appointment.type} • <strong>Fee:</strong> ${appointment.fee}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(appointment)}
                  >
                    View Details
                  </Button>
                  
                  {appointment.status === 'waiting' || appointment.status === 'in-progress' ? (
                    <Button
                      size="sm"
                      onClick={() => handleMarkComplete(appointment.id)}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Complete
                    </Button>
                  ) : null}
                  
                  {appointment.status === 'confirmed' || appointment.status === 'waiting' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      <XCircle size={16} className="mr-1" />
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Patient Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{selectedAppointment.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{selectedAppointment.patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedAppointment.patient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedAppointment.patient.email}</p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">{selectedDate} at {selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{selectedAppointment.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-medium">{selectedAppointment.doctor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedAppointment.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fee</p>
                  <p className="font-medium">${selectedAppointment.fee}</p>
                </div>
              </div>
            </div>

            {/* Reason & Notes */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Reason for Visit</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {selectedAppointment.patient.reason}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
              <textarea
                defaultValue={selectedAppointment.notes}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add notes about this appointment..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button>
                Save Notes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};