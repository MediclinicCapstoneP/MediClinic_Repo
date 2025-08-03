import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { doctorService, DoctorProfile } from '../../features/auth/utils/doctorService';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import {
  AppointmentWithDetails,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';

interface AppointmentProps {
  clinicId: string;
}

export const Appointment: React.FC<AppointmentProps> = ({ clinicId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, [clinicId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters = {
        clinic_id: clinicId,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDate && { appointment_date: filterDate })
      };

      const appointmentsData = await AppointmentService.getAppointmentsWithDetails(filters);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const result = await doctorService.getDoctorsByClinicId(clinicId);
      if (result.success && result.doctors) {
        setDoctors(result.doctors);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleConfirmAppointment = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowConfirmDialog(true);
  };

  const confirmAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await AppointmentService.updateAppointment(selectedAppointment.id, {
        status: 'confirmed',
        confirmation_sent: true,
        confirmation_sent_at: new Date().toISOString()
      });
      await loadAppointments();
      setShowConfirmDialog(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleAssignDoctor = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setSelectedDoctorId(appointment.doctor_id || '');
    setShowAssignDoctorModal(true);
  };

  const assignDoctor = async () => {
    if (!selectedAppointment || !selectedDoctorId) return;

    try {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      await AppointmentService.updateAppointment(selectedAppointment.id, {
        doctor_id: selectedDoctorId,
        doctor_name: selectedDoctor?.full_name || '',
        doctor_specialty: selectedDoctor?.specialization || ''
      });
      await loadAppointments();
      setShowAssignDoctorModal(false);
      setSelectedAppointment(null);
      setSelectedDoctorId('');
    } catch (error) {
      console.error('Error assigning doctor:', error);
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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusClass = APPOINTMENT_STATUS_COLORS[status];
    const statusText = APPOINTMENT_STATUSES[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {statusText}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClass =
      APPOINTMENT_PRIORITY_COLORS[priority as keyof typeof APPOINTMENT_PRIORITY_COLORS];
    const priorityText =
      APPOINTMENT_PRIORITIES[priority as keyof typeof APPOINTMENT_PRIORITIES];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
        {priorityText}
      </span>
    );
  };

  const isSelected = (appointment: AppointmentWithDetails) =>
    selectedAppointment?.id === appointment.id;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width={200} height={32} />
          <div className="flex gap-4">
            <Skeleton width={120} height={40} />
            <Skeleton width={100} height={40} />
            <Skeleton width={80} height={40} />
          </div>
        </div>
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          {selectedAppointment && (
            <div className="mt-1 text-sm text-blue-600">
              Selected:{' '}
              <strong>
                {selectedAppointment.patient?.first_name}{' '}
                {selectedAppointment.patient?.last_name} on{' '}
                {formatDate(selectedAppointment.appointment_date)}
              </strong>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as AppointmentStatus | 'all')
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <Button onClick={loadAppointments} variant="outline">
            Refresh
          </Button>
          <Button
            onClick={() => selectedAppointment && handleAssignDoctor(selectedAppointment)}
            disabled={!selectedAppointment}
          >
            {selectedAppointment?.doctor_id ? 'Reassign Doctor' : 'Assign Doctor'}
          </Button>
          {selectedAppointment && selectedAppointment.status === 'scheduled' && (
            <Button onClick={() => handleConfirmAppointment(selectedAppointment)}>
              Confirm
            </Button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isSelected(appointment) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="radio"
                        name="selectedAppointment"
                        checked={isSelected(appointment)}
                        onChange={() => setSelectedAppointment(appointment)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient?.first_name}{' '}
                          {appointment.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.patient?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.appointment_time)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {APPOINTMENT_TYPES[appointment.appointment_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.doctor_name ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.doctor_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctor_specialty}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(appointment.priority)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Appointment Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmAppointment}
        title="Confirm Appointment"
        message={`Are you sure you want to confirm the appointment for ${
          selectedAppointment?.patient?.first_name || ''
        } ${selectedAppointment?.patient?.last_name || ''} on ${
          selectedAppointment ? formatDate(selectedAppointment.appointment_date) : ''
        }?`}
      />

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={showAssignDoctorModal}
        onClose={() => setShowAssignDoctorModal(false)}
        title="Assign Doctor"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowAssignDoctorModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={assignDoctor} disabled={!selectedDoctorId}>
              {selectedAppointment?.doctor_id ? 'Reassign' : 'Assign'} Doctor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
