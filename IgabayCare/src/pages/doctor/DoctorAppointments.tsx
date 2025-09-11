import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { doctorDashboardService } from '../../features/auth/utils/doctorDashboardService';
import { prescriptionService, CreatePrescriptionData } from '../../features/auth/utils/prescriptionService';
import { AppointmentServicesService } from '../../features/auth/utils/appointmentServicesService';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import { 
  Calendar, Clock, User, Stethoscope, FileText, Pill, Edit3,
  CheckCircle, AlertCircle, Eye, Plus, X, Save, Phone, Mail
} from 'lucide-react';
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
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [appointmentServices, setAppointmentServices] = useState<Record<string, string[]>>({});
  
  // Consultation and prescription state
  const [consultationNotes, setConsultationNotes] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [''],
    dosages: [''],
    frequencies: [''],
    durations: [''],
    instructions: [''],
    refills: [0]
  });

  useEffect(() => {
    loadAppointments();
  }, [doctorId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      const result = await doctorDashboardService.getDoctorAppointments(doctorId, {
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDate && { date: filterDate })
      });
      
      if (result.success && result.appointments) {
        setAppointments(result.appointments);
        
        // Load services for each appointment
        const servicesMap: Record<string, string[]> = {};
        await Promise.all(
          result.appointments.map(async (appointment) => {
            try {
              const services = await AppointmentServicesService.getAppointmentServicesDisplay(
                appointment.id,
                appointment.appointment_type,
                appointment.clinic_id
              );
              servicesMap[appointment.id] = services;
            } catch (error) {
              console.warn(`Error loading services for appointment ${appointment.id}:`, error);
              servicesMap[appointment.id] = [];
            }
          })
        );
        setAppointmentServices(servicesMap);
      } else {
        console.error('Error loading appointments:', result.error);
      }
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
      const result = await doctorDashboardService.updateAppointmentStatus(selectedAppointment.id, 'in_progress');
      if (result.success) {
        await loadAppointments();
        setShowStartAppointmentModal(false);
        setSelectedAppointment(null);
      } else {
        alert(`Error starting appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting appointment:', error);
      alert('Failed to start appointment');
    }
  };

  const handleCompleteAppointment = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setConsultationNotes(appointment.doctor_notes || '');
    setShowCompleteAppointmentModal(true);
  };

  const completeAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const result = await doctorDashboardService.updateAppointmentStatus(
        selectedAppointment.id, 
        'completed', 
        consultationNotes
      );
      if (result.success) {
        await loadAppointments();
        setShowCompleteAppointmentModal(false);
        setSelectedAppointment(null);
        setConsultationNotes('');
      } else {
        alert(`Error completing appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Failed to complete appointment');
    }
  };

  const handleReschedule = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time);
    setShowRescheduleModal(true);
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newTime) return;

    try {
      const result = await doctorDashboardService.rescheduleAppointment(
        selectedAppointment.id,
        newDate,
        newTime
      );
      if (result.success) {
        await loadAppointments();
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        setNewDate('');
        setNewTime('');
      } else {
        alert(`Error rescheduling appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment');
    }
  };

  const handleAddConsultation = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setConsultationNotes(appointment.doctor_notes || '');
    setShowConsultationModal(true);
  };

  const saveConsultationNotes = async () => {
    if (!selectedAppointment) return;

    try {
      const result = await doctorDashboardService.updateAppointmentStatus(
        selectedAppointment.id,
        selectedAppointment.status,
        consultationNotes
      );
      if (result.success) {
        await loadAppointments();
        setShowConsultationModal(false);
        setSelectedAppointment(null);
        setConsultationNotes('');
        alert('Consultation notes saved successfully!');
      } else {
        alert(`Error saving consultation notes: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving consultation notes:', error);
      alert('Failed to save consultation notes');
    }
  };

  const handleCreatePrescription = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setPrescriptionData({
      medications: [''],
      dosages: [''],
      frequencies: [''],
      durations: [''],
      instructions: [''],
      refills: [0]
    });
    setShowPrescriptionModal(true);
  };

  const addPrescriptionField = () => {
    setPrescriptionData(prev => ({
      medications: [...prev.medications, ''],
      dosages: [...prev.dosages, ''],
      frequencies: [...prev.frequencies, ''],
      durations: [...prev.durations, ''],
      instructions: [...prev.instructions, ''],
      refills: [...prev.refills, 0]
    }));
  };

  const removePrescriptionField = (index: number) => {
    setPrescriptionData(prev => ({
      medications: prev.medications.filter((_, i) => i !== index),
      dosages: prev.dosages.filter((_, i) => i !== index),
      frequencies: prev.frequencies.filter((_, i) => i !== index),
      durations: prev.durations.filter((_, i) => i !== index),
      instructions: prev.instructions.filter((_, i) => i !== index),
      refills: prev.refills.filter((_, i) => i !== index)
    }));
  };

  const updatePrescriptionField = (index: number, field: string, value: string | number) => {
    setPrescriptionData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const createPrescription = async () => {
    if (!selectedAppointment) return;

    try {
      const prescriptionsToCreate: CreatePrescriptionData[] = prescriptionData.medications
        .filter((med, index) => med.trim() && prescriptionData.dosages[index]?.trim())
        .map((medication, index) => ({
          patient_id: selectedAppointment.patient_id,
          doctor_id: doctorId,
          clinic_id: selectedAppointment.clinic_id,
          medication_name: medication.trim(),
          dosage: prescriptionData.dosages[index]?.trim() || '',
          frequency: prescriptionData.frequencies[index]?.trim() || 'As needed',
          duration: prescriptionData.durations[index]?.trim() || '',
          instructions: prescriptionData.instructions[index]?.trim() || '',
          prescribed_date: new Date().toISOString().split('T')[0],
          refills_remaining: prescriptionData.refills[index] || 0,
          status: 'active'
        }));

      if (prescriptionsToCreate.length === 0) {
        alert('Please add at least one medication with dosage');
        return;
      }

      const result = await prescriptionService.createMultiplePrescriptions(prescriptionsToCreate);
      
      if (result.success) {
        await loadAppointments();
        setShowPrescriptionModal(false);
        setSelectedAppointment(null);
        alert('Prescription created successfully!');
      } else {
        alert(`Failed to create prescription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription');
    }
  };

  const handleViewPatient = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowPatientDetailsModal(true);
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

  const getActionButtons = (appointment: AppointmentWithDetails) => {
    return (
      <div className="flex flex-wrap gap-2">
        {/* View Patient Details */}
        <Button
          onClick={() => handleViewPatient(appointment)}
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>

        {/* Start Appointment (for confirmed appointments) */}
        {appointment.status === 'confirmed' && (
          <Button
            onClick={() => handleStartAppointment(appointment)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}

        {/* Complete Appointment (for in-progress appointments) */}
        {appointment.status === 'in_progress' && (
          <Button
            onClick={() => handleCompleteAppointment(appointment)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}

        {/* Consultation Notes (for any appointment) */}
        <Button
          onClick={() => handleAddConsultation(appointment)}
          size="sm"
          variant="outline"
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <FileText className="h-3 w-3 mr-1" />
          Notes
        </Button>

        {/* Create Prescription */}
        <Button
          onClick={() => handleCreatePrescription(appointment)}
          size="sm"
          variant="outline"
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Pill className="h-3 w-3 mr-1" />
          Rx
        </Button>

        {/* Reschedule (for non-completed appointments) */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <Button
            onClick={() => handleReschedule(appointment)}
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Reschedule
          </Button>
        )}
      </div>
    );
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient_name || 
                             (appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Unknown Patient')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {appointment.patient?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{appointment.patient.email}</span>
                              </div>
                            )}
                          </div>
                          {appointment.patient?.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-3 w-3" />
                              <span>{appointment.patient.phone}</span>
                            </div>
                          )}
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
                        <div className="text-sm text-gray-500">
                          {appointment.duration_minutes} min
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {APPOINTMENT_TYPES[appointment.appointment_type]}
                          </span>
                        </div>
                        {appointmentServices[appointment.id] && appointmentServices[appointment.id].length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {AppointmentServicesService.formatServicesDisplay(appointmentServices[appointment.id])}
                          </div>
                        )}
                        {appointment.payment_amount && (
                          <div className="text-xs text-green-600 mt-1 font-medium">
                            ₱{appointment.payment_amount.toLocaleString()}
                          </div>
                        )}
                      </div>
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
                    <td className="px-6 py-4 text-sm font-medium">
                      {getActionButtons(appointment)}
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
      <Modal
        isOpen={showCompleteAppointmentModal}
        onClose={() => setShowCompleteAppointmentModal(false)}
        title="Complete Appointment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Patient')}
            </h3>
            <p className="text-sm text-blue-700">
              {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} - {selectedAppointment?.appointment_date}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Notes (Optional)
            </label>
            <textarea
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Enter consultation notes, diagnosis, treatment plan, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowCompleteAppointmentModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={completeAppointment}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Appointment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Patient')}
            </h3>
            <p className="text-sm text-orange-700">
              Current: {selectedAppointment?.appointment_date} at {selectedAppointment?.appointment_time}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Date
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Time
              </label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowRescheduleModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={rescheduleAppointment} disabled={!newDate || !newTime}>
              <Edit3 className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Consultation Notes Modal */}
      <Modal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        title="Consultation Notes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Patient')}
            </h3>
            <p className="text-sm text-purple-700">
              {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} - {selectedAppointment?.appointment_date}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Notes
            </label>
            <textarea
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Enter detailed consultation notes, diagnosis, symptoms, treatment plan, recommendations, etc."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowConsultationModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveConsultationNotes}>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        title="Create Prescription"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Patient')}
            </h3>
            <p className="text-sm text-green-700">
              {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} - {selectedAppointment?.appointment_date}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Medications</h4>
              <Button onClick={addPrescriptionField} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </div>
            
            {prescriptionData.medications.map((_, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-700">Medication {index + 1}</h5>
                  {prescriptionData.medications.length > 1 && (
                    <Button 
                      onClick={() => removePrescriptionField(index)}
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name *
                    </label>
                    <Input
                      placeholder="e.g., Amoxicillin"
                      value={prescriptionData.medications[index]}
                      onChange={(e) => updatePrescriptionField(index, 'medications', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={prescriptionData.dosages[index]}
                      onChange={(e) => updatePrescriptionField(index, 'dosages', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <Input
                      placeholder="e.g., Twice daily"
                      value={prescriptionData.frequencies[index]}
                      onChange={(e) => updatePrescriptionField(index, 'frequencies', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <Input
                      placeholder="e.g., 7 days"
                      value={prescriptionData.durations[index]}
                      onChange={(e) => updatePrescriptionField(index, 'durations', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <Input
                      placeholder="e.g., Take with meals"
                      value={prescriptionData.instructions[index]}
                      onChange={(e) => updatePrescriptionField(index, 'instructions', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refills
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={prescriptionData.refills[index]}
                      onChange={(e) => updatePrescriptionField(index, 'refills', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setShowPrescriptionModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={createPrescription}>
              <Pill className="h-4 w-4 mr-2" />
              Create Prescription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showPatientDetailsModal}
        onClose={() => setShowPatientDetailsModal(false)}
        title="Patient Details"
        size="lg"
      >
        <div className="space-y-6">
          {selectedAppointment && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedAppointment.patient_name || 
                     (selectedAppointment.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient')}
                  </h3>
                  <p className="text-gray-600">
                    Patient ID: {selectedAppointment.patient_id}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedAppointment.patient?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedAppointment.patient.email}</span>
                      </div>
                    )}
                    {selectedAppointment.patient?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedAppointment.patient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Appointment Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedAppointment.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedAppointment.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{APPOINTMENT_TYPES[selectedAppointment.appointment_type]}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Patient Notes</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedAppointment.doctor_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Doctor Notes</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">{selectedAppointment.doctor_notes}</p>
                  </div>
                </div>
              )}
              
              {appointmentServices[selectedAppointment.id] && appointmentServices[selectedAppointment.id].length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      {AppointmentServicesService.formatServicesDisplay(appointmentServices[selectedAppointment.id])}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowPatientDetailsModal(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
