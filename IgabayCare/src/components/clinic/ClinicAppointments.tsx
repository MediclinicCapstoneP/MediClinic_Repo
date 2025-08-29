import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MoreHorizontal, CheckCircle, XCircle, UserPlus, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService } from '../../features/auth/utils/clinicService';

export const ClinicAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize data and fetch appointments
  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await roleBasedAuthService.getCurrentUser();
        if (user && user.role === 'clinic' && user.user && user.user.id) {
          setCurrentUser(user);

          const clinicResult = await clinicService.getClinicByUserId(user.user.id);
          if (clinicResult.success && clinicResult.clinic) {
            setClinicId(clinicResult.clinic.id);
            await fetchAppointments(clinicResult.clinic.id, selectedDate);
          }
        }
      } catch (error) {
        console.error('Error initializing clinic appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Fetch appointments when date changes
  useEffect(() => {
    if (clinicId) {
      fetchAppointments(clinicId, selectedDate);
    }
  }, [selectedDate, clinicId]);

  const fetchAppointments = async (clinicId: string, date: string) => {
    try {
      setLoading(true);
      const appointments = await AppointmentService.getAppointments({
        clinic_id: clinicId,
        appointment_date: date
      });
      setAppointments(appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleMarkComplete = async (appointmentId: string) => {
    try {
      const result = await AppointmentService.updateAppointment(appointmentId, { status: 'completed' });
      if (result) {
        // Refresh appointments
        if (clinicId) {
          await fetchAppointments(clinicId, selectedDate);
        }
      } else {
        console.error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const result = await AppointmentService.updateAppointment(appointmentId, { status: 'cancelled' });
      if (result) {
        // Refresh appointments
        if (clinicId) {
          await fetchAppointments(clinicId, selectedDate);
        }
      } else {
        console.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleAssignDoctor = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAssignDoctorModal(true);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return 'TBD';
    return `$${amount.toFixed(2)}`;
  };

  const getPatientName = (appointment: any) => {
    // Try different possible patient name fields
    if (appointment.patient_name) return appointment.patient_name;
    if (appointment.patient?.name) return appointment.patient.name;
    if (appointment.patient?.first_name && appointment.patient?.last_name) {
      return `${appointment.patient.first_name} ${appointment.patient.last_name}`;
    }
    return 'Unknown Patient';
  };

  const getDoctorName = (appointment: any) => {
    if (appointment.doctor_name) return appointment.doctor_name;
    if (appointment.doctor?.full_name) return appointment.doctor.full_name;
    if (appointment.doctor?.name) return appointment.doctor.name;
    return 'Unassigned';
  };

  const handleAssignSuccess = async () => {
    // Refresh appointments list after doctor assignment
    if (clinicId) {
      await fetchAppointments(clinicId, selectedDate);
    }
    setShowAssignDoctorModal(false);
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
                {appointments.length} appointments scheduled
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List - Simplified Display */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No appointments scheduled for {selectedDate}
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Time */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold text-gray-900">
                        {formatTime(appointment.appointment_time)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.duration_minutes || 30} min
                      </div>
                    </div>
                    
                    {/* Patient Name */}
                    <div className="min-w-[200px]">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getPatientName(appointment)}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Date (only show if different from selected date) */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Type */}
                    <div className="min-w-[120px]">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{appointment.appointment_type}</span>
                      </div>
                    </div>
                    
                    {/* Doctor */}
                    <div className="min-w-[150px]">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{getDoctorName(appointment)}</span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="min-w-[100px]">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    {/* Payment Amount / Booking Fee */}
                    <div className="min-w-[120px] text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <DollarSign size={16} className="text-green-600" />
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(appointment.payment_amount)}
                          </div>
                          <div className="text-xs text-gray-500">Booking Fee</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(appointment)}
                    >
                      Details
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignDoctor(appointment)}
                    >
                      <UserPlus size={16} className="mr-1" />
                      {getDoctorName(appointment) !== 'Unassigned' ? 'Change' : 'Assign'}
                    </Button>
                    
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkComplete(appointment.id)}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Complete
                      </Button>
                    )}
                    
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        <XCircle size={16} className="mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Appointment Summary</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium">{getPatientName(selectedAppointment)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {formatTime(selectedAppointment.appointment_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedAppointment.appointment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-medium">{getDoctorName(selectedAppointment)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booking Fee</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedAppointment.payment_amount)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedAppointment.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowAssignDoctorModal(true);
                  setShowDetailsModal(false);
                }}
              >
                <UserPlus size={16} className="mr-1" />
                {getDoctorName(selectedAppointment) !== 'Unassigned' ? 'Change Doctor' : 'Assign Doctor'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Note: AssignDoctor component needs to be implemented */}
      {/* {selectedAppointment && clinicId && (
        <AssignDoctor
          isOpen={showAssignDoctorModal}
          onClose={() => setShowAssignDoctorModal(false)}
          appointmentId={selectedAppointment.id}
          clinicId={clinicId}
          onAssignSuccess={handleAssignSuccess}
          currentDoctorId={selectedAppointment.doctor_id}
          currentDoctorName={getDoctorName(selectedAppointment)}
        />
      )} */}
    </div>
  );
};