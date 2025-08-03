import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
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

interface DoctorAppointmentsProps {
  doctorId: string;
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ doctorId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showStartAppointmentModal, setShowStartAppointmentModal] = useState(false);
  const [showCompleteAppointmentModal, setShowCompleteAppointmentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    loadAppointments();
  }, [doctorId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters = {
        doctor_id: doctorId,
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

  const handleStartAppointment = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowStartAppointmentModal(true);
  };

  const startAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await AppointmentService.updateAppointment(selectedAppointment.id, {
        status: 'in_progress'
      });

      await loadAppointments();
      setShowStartAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error starting appointment:', error);
    }
  };

  const handleCompleteAppointment = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowCompleteAppointmentModal(true);
  };

  const completeAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await AppointmentService.updateAppointment(selectedAppointment.id, {
        status: 'completed'
      });

      await loadAppointments();
      setShowCompleteAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error completing appointment:', error);
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
    const priorityClass = APPOINTMENT_PRIORITY_COLORS[priority as keyof typeof APPOINTMENT_PRIORITY_COLORS];
    const priorityText = APPOINTMENT_PRIORITIES[priority as keyof typeof APPOINTMENT_PRIORITIES];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
        {priorityText}
      </span>
    );
  };

  const getActionButton = (appointment: AppointmentWithDetails) => {
    switch (appointment.status) {
      case 'confirmed':
        return (
          <Button
            onClick={() => handleStartAppointment(appointment)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Start Appointment
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            onClick={() => handleCompleteAppointment(appointment)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Complete
          </Button>
        );
      case 'completed':
        return (
          <span className="text-sm text-gray-500">Completed</span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton width={200} height={32} />
          <div className="flex gap-4">
            <Skeleton width={120} height={40} />
            <Skeleton width={100} height={40} />
            <Skeleton width={80} height={40} />
          </div>
        </div>
        
        {/* Table Skeleton */}
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        <div className="flex gap-4">
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <Button onClick={loadAppointments} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Appointments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Clinic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.patient?.email}
                        </div>
                        {appointment.patient?.phone && (
                          <div className="text-sm text-gray-500">
                            {appointment.patient.phone}
                          </div>
                        )}
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
                        <div className="text-sm text-gray-500">
                          {appointment.duration_minutes} min
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {APPOINTMENT_TYPES[appointment.appointment_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.clinic?.clinic_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.clinic?.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(appointment.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getActionButton(appointment)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Start Appointment Dialog */}
      <ConfirmDialog
        isOpen={showStartAppointmentModal}
        onClose={() => setShowStartAppointmentModal(false)}
        onConfirm={startAppointment}
        title="Start Appointment"
        message={`Are you ready to start the appointment with ${selectedAppointment?.patient?.first_name} ${selectedAppointment?.patient?.last_name}?`}
      />

      {/* Complete Appointment Dialog */}
      <ConfirmDialog
        isOpen={showCompleteAppointmentModal}
        onClose={() => setShowCompleteAppointmentModal(false)}
        onConfirm={completeAppointment}
        title="Complete Appointment"
        message={`Are you sure you want to mark the appointment with ${selectedAppointment?.patient?.first_name} ${selectedAppointment?.patient?.last_name} as completed?`}
      />
    </div>
  );
}; 