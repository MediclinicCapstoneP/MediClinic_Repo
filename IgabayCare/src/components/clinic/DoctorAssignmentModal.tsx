import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { AppointmentNotificationService } from '../../services/appointmentNotificationService';
import { X, User, Calendar, Clock, Stethoscope } from 'lucide-react';

interface DoctorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    patient_notes?: string;
    patients: {
      first_name: string;
      last_name: string;
      phone?: string;
      email?: string;
    };
    clinics: {
      clinic_name: string;
    };
  };
  onDoctorAssigned?: () => void;
}

interface Doctor {
  id: string;
  doctor_name: string;
  specialty: string;
  email?: string;
  phone?: string;
}

export const DoctorAssignmentModal: React.FC<DoctorAssignmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onDoctorAssigned
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAvailableDoctors();
    }
  }, [isOpen]);

  const loadAvailableDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const { success, doctors: availableDoctors, error } = 
        await AppointmentNotificationService.getAvailableDoctors(appointment.clinics.clinic_name);

      if (success && availableDoctors) {
        setDoctors(availableDoctors);
      } else {
        console.error('Error loading doctors:', error);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) return;

    setLoading(true);
    try {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      if (!selectedDoctor) return;

      const { success, error } = await AppointmentNotificationService.assignDoctorToAppointment(
        appointment.id,
        selectedDoctorId,
        'clinic-user-id' // This should be the actual clinic user ID
      );

      if (success) {
        onDoctorAssigned?.();
        onClose();
      } else {
        alert(`Failed to assign doctor: ${error}`);
      }
    } catch (error) {
      console.error('Error assigning doctor:', error);
      alert('Failed to assign doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Assign Doctor to Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Appointment Details */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Appointment Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Patient:</span>
              <span className="ml-2 font-medium">
                {appointment.patients.first_name} {appointment.patients.last_name}
              </span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Date:</span>
              <span className="ml-2 font-medium">
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Time:</span>
              <span className="ml-2 font-medium">{appointment.appointment_time}</span>
            </div>
            
            <div className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Type:</span>
              <span className="ml-2 font-medium capitalize">
                {appointment.appointment_type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {appointment.patient_notes && (
            <div className="mt-4">
              <span className="text-sm text-gray-600">Patient Notes:</span>
              <p className="mt-1 text-sm bg-white p-3 rounded-lg border">
                {appointment.patient_notes}
              </p>
            </div>
          )}
        </div>

        {/* Doctor Selection */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Select Doctor
          </h3>

          {loadingDoctors ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No available doctors found</p>
              <p className="text-sm">Please add doctors to your clinic first</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${selectedDoctorId === doctor.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`
                          w-3 h-3 rounded-full mr-3 
                          ${selectedDoctorId === doctor.id ? 'bg-blue-500' : 'bg-gray-300'}
                        `} />
                        <h4 className="font-medium text-gray-900">{doctor.doctor_name}</h4>
                      </div>
                      
                      <div className="ml-6 mt-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Specialty:</span> {doctor.specialty}
                        </p>
                        
                        {doctor.email && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Email:</span> {doctor.email}
                          </p>
                        )}
                        
                        {doctor.phone && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Phone:</span> {doctor.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleAssignDoctor}
            disabled={!selectedDoctorId || loading || doctors.length === 0}
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Assigning...' : 'Assign Doctor'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAssignmentModal;
