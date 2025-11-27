import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { AppointmentNotificationService } from '../../services/appointmentNotificationService';
import DoctorAssignmentModal from './DoctorAssignmentModal';
import { Calendar, Clock, User, Phone, Mail, UserPlus, AlertCircle } from 'lucide-react';

interface PendingAppointmentsProps {
  clinicId: string;
}

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  patient_notes?: string;
  status: string;
  patients: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  clinics: {
    clinic_name: string;
  };
}

export const PendingAppointments: React.FC<PendingAppointmentsProps> = ({ clinicId }) => {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    loadPendingAppointments();
  }, [clinicId]);

  const loadPendingAppointments = async () => {
    setLoading(true);
    try {
      const { success, appointments: pendingAppointments, error } = 
        await AppointmentNotificationService.getPendingDoctorAssignments(clinicId);

      if (success && pendingAppointments) {
        setAppointments(pendingAppointments);
      } else {
        console.error('Error loading pending appointments:', error);
      }
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = (appointment: PendingAppointment) => {
    setSelectedAppointment(appointment);
    setShowAssignmentModal(true);
  };

  const handleDoctorAssigned = () => {
    setShowAssignmentModal(false);
    setSelectedAppointment(null);
    loadPendingAppointments(); // Refresh the list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Pending Doctor Assignments</h2>
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-orange-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Pending Doctor Assignments</h2>
          </div>
          <div className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {appointments.length} pending
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Assignments</h3>
            <p className="text-gray-500">All appointments have been assigned to doctors.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Patient Info */}
                    <div className="flex items-center mb-3">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="font-semibold text-gray-900">
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </h3>
                      <span className={`
                        ml-3 px-2 py-1 text-xs rounded-full font-medium
                        ${appointment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                        }
                      `}>
                        {appointment.status}
                      </span>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(appointment.appointment_date)}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(appointment.appointment_time)}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="capitalize">
                          {appointment.appointment_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      {appointment.patients.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {appointment.patients.phone}
                        </div>
                      )}
                      
                      {appointment.patients.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          {appointment.patients.email}
                        </div>
                      )}
                    </div>

                    {/* Patient Notes */}
                    {appointment.patient_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {appointment.patient_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <Button
                      onClick={() => handleAssignDoctor(appointment)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Doctor
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctor Assignment Modal */}
      {selectedAppointment && (
        <DoctorAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onDoctorAssigned={handleDoctorAssigned}
        />
      )}
    </>
  );
};

export default PendingAppointments;
