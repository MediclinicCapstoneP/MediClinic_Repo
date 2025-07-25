import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

export const PatientAppointments: React.FC = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const mockAppointments = [
    {
      id: 1,
      clinicName: 'City General Hospital',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'General Medicine',
      date: '2024-01-15',
      time: '14:00',
      status: 'upcoming',
      address: '123 Main Street, Downtown',
      phone: '+1 234-567-8900',
      notes: 'Annual checkup',
      paymentStatus: 'paid',
      consultationFee: 150,
    },
    {
      id: 2,
      clinicName: 'Heart Care Center',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      date: '2024-01-18',
      time: '10:30',
      status: 'upcoming',
      address: '456 Oak Avenue, Medical District',
      phone: '+1 234-567-8901',
      notes: 'Follow-up consultation',
      paymentStatus: 'paid',
      consultationFee: 200,
    },
    {
      id: 3,
      clinicName: 'QuickCare Medical',
      doctorName: 'Dr. Emily Davis',
      specialty: 'Family Medicine',
      date: '2023-12-20',
      time: '16:15',
      status: 'completed',
      address: '789 Pine Street, Family District',
      phone: '+1 234-567-8902',
      notes: 'Flu symptoms',
      paymentStatus: 'paid',
      consultationFee: 120,
    },
  ];

  const upcomingAppointments = mockAppointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = mockAppointments.filter(apt => apt.status === 'completed');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2024-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
        <p className="text-gray-600">Manage your healthcare appointments</p>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
        
        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming appointments</p>
              <Button className="mt-4">Schedule New Appointment</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} hover>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.clinicName}
                          </h3>
                          <p className="text-gray-600">
                            {appointment.doctorName} • {appointment.specialty}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {appointment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar size={16} />
                          <span className="text-sm">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} />
                          <span className="text-sm">{formatTime(appointment.time)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin size={16} />
                          <span className="text-sm">{appointment.address}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={16} />
                          <span className="text-sm">{appointment.phone}</span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Fee: <strong>${appointment.consultationFee}</strong>
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {appointment.paymentStatus}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowRescheduleModal(true)}
                          >
                            Reschedule
                          </Button>
                          <Button variant="danger" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
        
        <div className="space-y-4">
          {pastAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.clinicName}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.doctorName} • {appointment.specialty}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock size={16} />
                        <span className="text-sm">{formatTime(appointment.time)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Fee: <strong>${appointment.consultationFee}</strong>
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Book Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Select a new date and time for your appointment.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
              <input
                type="date"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
              <select className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>2:00 PM</option>
                <option>3:00 PM</option>
                <option>4:00 PM</option>
              </select>
            </div>
          </div>

          <textarea
            placeholder="Reason for rescheduling (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
              Cancel
            </Button>
            <Button>
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};