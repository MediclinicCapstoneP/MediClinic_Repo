/**
 * Enhanced Doctor Workflow Manager - Complete doctor appointment and prescription management
 * Handles appointment confirmation, consultation, and prescription creation
 */

import React, { useState, useEffect } from 'react';
import { enhancedBookingService, type DoctorActionData, type PrescriptionData, type Medication } from '../../services/enhancedBookingService';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/Button';
import { 
  Calendar, Clock, User, Mail, Phone, FileText, CheckCircle, XCircle,
  AlertCircle, Loader2, RefreshCw, Filter, Search, Plus, Trash2, Edit,
  PlayCircle, StopCircle, FileText as PrescriptionIcon
} from 'lucide-react';

interface DoctorAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  requested_services: string[];
  patient_notes: string;
  clinic_name: string;
  clinic_phone: string;
  response_status?: string;
  assigned_at?: string;
  confirmed_at?: string;
  declined_at?: string;
  decline_reason?: string;
  doctor_notes?: string;
  started_at?: string;
  completed_at?: string;
  prescription_id?: string;
  created_at: string;
}

interface EnhancedDoctorWorkflowManagerProps {
  doctorId: string;
  onRefresh?: () => void;
}

export const EnhancedDoctorWorkflowManager: React.FC<EnhancedDoctorWorkflowManagerProps> = ({
  doctorId,
  onRefresh
}) => {
  // State management
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'decline' | 'start' | 'complete'>('confirm');
  const [actionNotes, setActionNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    appointment_id: '',
    doctor_id: doctorId,
    patient_id: '',
    diagnosis: '',
    medications: [],
    instructions: ''
  });
  const [currentMedication, setCurrentMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    instructions: ''
  });

  // Load appointments
  const loadAppointments = async () => {
    try {
      const result = await enhancedBookingService.getDoctorAppointments(doctorId);
      if (result.success) {
        setAppointments(result.data || []);
      } else {
        console.error('Error loading appointments:', result.error);
        setError('Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    }
  };

  // Handle doctor actions
  const handleDoctorAction = async () => {
    if (!selectedAppointment) {
      setError('No appointment selected');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const actionData: DoctorActionData = {
        appointment_id: selectedAppointment.id,
        doctor_id: doctorId,
        action: actionType,
        notes: actionNotes,
        decline_reason: actionType === 'decline' ? declineReason : undefined
      };

      const result = await enhancedBookingService.handleDoctorAction(actionData);
      
      if (result.success) {
        setSuccess(`Appointment ${actionType}d successfully`);
        setShowActionModal(false);
        setSelectedAppointment(null);
        setActionNotes('');
        setDeclineReason('');
        await loadAppointments();
        onRefresh?.();

        // If appointment is completed, show prescription modal
        if (actionType === 'complete') {
          setPrescriptionData(prev => ({
            ...prev,
            appointment_id: selectedAppointment.id,
            patient_id: selectedAppointment.patient_id || ''
          }));
          setShowPrescriptionModal(true);
        }
      } else {
        setError(result.error || `Failed to ${actionType} appointment`);
      }
    } catch (error) {
      console.error('Error handling doctor action:', error);
      setError(`Failed to ${actionType} appointment`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle prescription creation
  const handleCreatePrescription = async () => {
    if (!prescriptionData.diagnosis || prescriptionData.medications.length === 0) {
      setError('Please provide diagnosis and at least one medication');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await enhancedBookingService.createPrescription(prescriptionData);
      
      if (result.success) {
        setSuccess('Prescription created successfully');
        setShowPrescriptionModal(false);
        setPrescriptionData({
          appointment_id: '',
          doctor_id: doctorId,
          patient_id: '',
          diagnosis: '',
          medications: [],
          instructions: ''
        });
        setCurrentMedication({
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: '',
          instructions: ''
        });
        await loadAppointments();
      } else {
        setError(result.error || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      setError('Failed to create prescription');
    } finally {
      setActionLoading(false);
    }
  };

  // Add medication to prescription
  const addMedication = () => {
    if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency) {
      setError('Please fill in required medication fields');
      return;
    }

    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, { ...currentMedication }]
    }));

    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: ''
    });
  };

  // Remove medication from prescription
  const removeMedication = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Open action modal
  const openActionModal = (appointment: DoctorAppointment, action: 'confirm' | 'decline' | 'start' | 'complete') => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setActionNotes('');
    setDeclineReason('');
    setShowActionModal(true);
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = !searchTerm || 
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.requested_services.some(service => 
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-800', icon: User, label: 'Assigned to You' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmed' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: PlayCircle, label: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Load data on mount
  useEffect(() => {
    loadAppointments();
  }, [doctorId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, [doctorId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Appointments</h2>
          <p className="text-sm text-gray-600">Manage your appointments and prescriptions</p>
        </div>
        <Button
          onClick={loadAppointments}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, email, or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading appointments...</span>
        </div>
      ) : (
        <>
          {/* Appointments list */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No appointments match your filters.' 
                  : 'No appointments assigned to you at this time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white border rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{appointment.patient_name}</h3>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {appointment.patient_email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {appointment.patient_phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })} at {appointment.appointment_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'assigned' && (
                        <>
                          <Button
                            onClick={() => openActionModal(appointment, 'confirm')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Confirm
                          </Button>
                          <Button
                            onClick={() => openActionModal(appointment, 'decline')}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button
                          onClick={() => openActionModal(appointment, 'start')}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Start Consultation
                        </Button>
                      )}
                      {appointment.status === 'in_progress' && (
                        <Button
                          onClick={() => openActionModal(appointment, 'complete')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  {appointment.requested_services.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Requested Services:</div>
                      <div className="flex flex-wrap gap-1">
                        {appointment.requested_services.map((service, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {appointment.patient_notes && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Patient Notes:</div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{appointment.patient_notes}</p>
                    </div>
                  )}

                  {/* Clinic info */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700 mb-1">Clinic:</div>
                    <div className="text-sm text-gray-600">{appointment.clinic_name}</div>
                    {appointment.clinic_phone && (
                      <div className="text-sm text-gray-500">{appointment.clinic_phone}</div>
                    )}
                  </div>

                  {/* Doctor notes */}
                  {appointment.doctor_notes && (
                    <div className="mt-3 bg-blue-50 p-3 rounded">
                      <div className="text-sm font-medium text-blue-900 mb-1">Your Notes:</div>
                      <p className="text-sm text-blue-800">{appointment.doctor_notes}</p>
                    </div>
                  )}

                  {/* Prescription link */}
                  {appointment.prescription_id && (
                    <div className="mt-3 flex items-center text-green-600">
                      <PrescriptionIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">Prescription created</span>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    {appointment.assigned_at && (
                      <div>Assigned on {new Date(appointment.assigned_at).toLocaleString()}</div>
                    )}
                    {appointment.confirmed_at && (
                      <div>Confirmed on {new Date(appointment.confirmed_at).toLocaleString()}</div>
                    )}
                    {appointment.started_at && (
                      <div>Started on {new Date(appointment.started_at).toLocaleString()}</div>
                    )}
                    {appointment.completed_at && (
                      <div>Completed on {new Date(appointment.completed_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {showActionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold capitalize">
                  {actionType === 'confirm' ? 'Confirm Appointment' :
                   actionType === 'decline' ? 'Decline Appointment' :
                   actionType === 'start' ? 'Start Consultation' : 'Complete Consultation'}
                </h3>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedAppointment(null);
                    setActionNotes('');
                    setDeclineReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Appointment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient:</span>
                    <p className="font-medium">{selectedAppointment.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date/Time:</span>
                    <p className="font-medium">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedAppointment.patient_email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedAppointment.patient_phone}</p>
                  </div>
                </div>
              </div>

              {/* Action-specific fields */}
              <div className="space-y-4">
                {actionType === 'decline' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decline Reason *
                    </label>
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Please provide a reason for declining this appointment..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {actionType === 'confirm' ? 'Confirmation Notes' :
                     actionType === 'decline' ? 'Additional Notes' :
                     actionType === 'start' ? 'Consultation Notes' : 'Completion Notes'}
                    <span className="text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={
                      actionType === 'confirm' ? 'Add any notes for the patient about the confirmed appointment...' :
                      actionType === 'decline' ? 'Add any additional notes...' :
                      actionType === 'start' ? 'Add notes about starting the consultation...' :
                      'Add notes about the completed consultation...'
                    }
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedAppointment(null);
                    setActionNotes('');
                    setDeclineReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDoctorAction}
                  disabled={actionLoading || (actionType === 'decline' && !declineReason.trim())}
                  loading={actionLoading}
                  className={
                    actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    actionType === 'decline' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    actionType === 'start' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                >
                  {actionType === 'confirm' ? 'Confirm Appointment' :
                   actionType === 'decline' ? 'Decline Appointment' :
                   actionType === 'start' ? 'Start Consultation' : 'Complete Consultation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create Prescription</h3>
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setPrescriptionData({
                      appointment_id: '',
                      doctor_id: doctorId,
                      patient_id: '',
                      diagnosis: '',
                      medications: [],
                      instructions: ''
                    });
                    setCurrentMedication({
                      name: '',
                      dosage: '',
                      frequency: '',
                      duration: '',
                      quantity: '',
                      instructions: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient:</span>
                    <p className="font-medium">{selectedAppointment?.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Appointment:</span>
                    <p className="font-medium">
                      {selectedAppointment && new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment?.appointment_time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prescription Form */}
              <div className="space-y-6">
                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis *
                  </label>
                  <textarea
                    value={prescriptionData.diagnosis}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Enter diagnosis..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medications *
                  </label>
                  
                  {/* Current medications list */}
                  {prescriptionData.medications.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {prescriptionData.medications.map((med, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{med.name}</div>
                            <div className="text-sm text-gray-600">
                              {med.dosage} • {med.frequency} • {med.duration}
                            </div>
                            {med.quantity && (
                              <div className="text-sm text-gray-500">Quantity: {med.quantity}</div>
                            )}
                            {med.instructions && (
                              <div className="text-sm text-gray-500 mt-1">{med.instructions}</div>
                            )}
                          </div>
                          <button
                            onClick={() => removeMedication(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add medication form */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">Add Medication</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Medication name *"
                        value={currentMedication.name}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage * (e.g., 500mg)"
                        value={currentMedication.dosage}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Frequency * (e.g., Twice daily)"
                        value={currentMedication.frequency}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 7 days)"
                        value={currentMedication.duration}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Quantity (e.g., 14 tablets)"
                        value={currentMedication.quantity}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, quantity: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Special instructions"
                        value={currentMedication.instructions}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <Button
                      onClick={addMedication}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Instructions *
                  </label>
                  <textarea
                    value={prescriptionData.instructions}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Enter general instructions for the patient..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Follow-up date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={prescriptionData.follow_up_date || ''}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setPrescriptionData({
                      appointment_id: '',
                      doctor_id: doctorId,
                      patient_id: '',
                      diagnosis: '',
                      medications: [],
                      instructions: ''
                    });
                    setCurrentMedication({
                      name: '',
                      dosage: '',
                      frequency: '',
                      duration: '',
                      quantity: '',
                      instructions: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePrescription}
                  disabled={!prescriptionData.diagnosis || prescriptionData.medications.length === 0 || actionLoading}
                  loading={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Create Prescription
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
