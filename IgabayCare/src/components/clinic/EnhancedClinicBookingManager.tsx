/**
 * Enhanced Clinic Booking Manager - Complete clinic workflow management
 * Handles appointment processing, doctor assignment, and clinic operations
 */

import React, { useState, useEffect } from 'react';
import { enhancedBookingService, type ClinicAssignmentData } from '../../services/enhancedBookingService';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/Button';
import { 
  Calendar, Clock, User, Mail, Phone, FileText, CheckCircle, XCircle,
  AlertCircle, UserPlus, Loader2, RefreshCw, Filter, Search
} from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  requested_services: string[];
  patient_notes: string;
  clinic_notes: string;
  assigned_at?: string;
  assigned_doctor_name?: string;
  response_status?: string;
  responded_at?: string;
  created_at: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  is_active: boolean;
}

interface EnhancedClinicBookingManagerProps {
  clinicId: string;
  onRefresh?: () => void;
}

export const EnhancedClinicBookingManager: React.FC<EnhancedClinicBookingManagerProps> = ({
  clinicId,
  onRefresh
}) => {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  const loadAppointments = async () => {
    try {
      const result = await enhancedBookingService.getClinicPendingAppointments(clinicId);
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

  const loadDoctors = async () => {
    try {
      const result = await enhancedBookingService.getAvailableDoctors(clinicId);
      if (result.success) {
        setDoctors(result.data || []);
      } else {
        console.error('Error loading doctors:', result.error);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAppointments(), loadDoctors()]);
    setLoading(false);
  };

  // Handle appointment assignment
  const handleAssignDoctor = async () => {
    if (!selectedAppointment || !selectedDoctor) {
      setError('Please select a doctor for assignment');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get clinic user ID for assignment
      const { data: clinicUser } = await supabase.auth.getUser();
      if (!clinicUser.user) {
        setError('Authentication required');
        return;
      }

      const assignmentData: ClinicAssignmentData = {
        appointment_id: selectedAppointment.id,
        doctor_id: selectedDoctor,
        clinic_id: clinicId,
        assigned_by: clinicUser.user.id,
        notes: assignmentNotes
      };

      const result = await enhancedBookingService.assignAppointmentToDoctor(assignmentData);
      
      if (result.success) {
        setSuccess('Appointment assigned successfully');
        setShowAssignmentModal(false);
        setSelectedAppointment(null);
        setSelectedDoctor('');
        setAssignmentNotes('');
        await loadAppointments(); // Refresh appointments
        onRefresh?.();
      } else {
        setError(result.error || 'Failed to assign appointment');
      }
    } catch (error) {
      console.error('Error assigning appointment:', error);
      setError('Failed to assign appointment');
    } finally {
      setActionLoading(false);
    }
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
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Assignment' },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: User, label: 'Assigned to Doctor' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmed' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Response status badge
  const ResponseBadge: React.FC<{ status?: string }> = ({ status }) => {
    if (!status) return null;

    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending Response' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [clinicId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, [clinicId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Appointment Management</h2>
          <p className="text-sm text-gray-600">Manage patient bookings and doctor assignments</p>
        </div>
        <Button
          onClick={loadData}
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
            <option value="pending">Pending Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="in_progress">In Progress</option>
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
                  : 'No pending appointments at this time.'}
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
                        {appointment.response_status && (
                          <ResponseBadge status={appointment.response_status} />
                        )}
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
                      {appointment.status === 'pending' && (
                        <Button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAssignmentModal(true);
                          }}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Assign Doctor
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

                  {/* Assignment info */}
                  {appointment.assigned_doctor_name && (
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm font-medium text-blue-900 mb-1">Assigned to:</div>
                      <div className="text-sm text-blue-800">{appointment.assigned_doctor_name}</div>
                      {appointment.assigned_at && (
                        <div className="text-xs text-blue-600 mt-1">
                          Assigned on {new Date(appointment.assigned_at).toLocaleString()}
                        </div>
                      )}
                      {appointment.clinic_notes && (
                        <div className="text-sm text-blue-800 mt-2">
                          <strong>Clinic Notes:</strong> {appointment.clinic_notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Response info */}
                  {appointment.responded_at && (
                    <div className="mt-3 text-xs text-gray-500">
                      Doctor responded on {new Date(appointment.responded_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Assign Doctor</h3>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedAppointment(null);
                    setSelectedDoctor('');
                    setAssignmentNotes('');
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
                {selectedAppointment.requested_services.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600">Services:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAppointment.requested_services.map((service, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Doctor Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor *
                  </label>
                  {doctors.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No available doctors found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {doctors.map((doctor) => (
                        <label
                          key={doctor.id}
                          className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name="doctor"
                            value={doctor.id}
                            checked={selectedDoctor === doctor.id}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </div>
                            {doctor.specialization && (
                              <div className="text-sm text-gray-600">{doctor.specialization}</div>
                            )}
                            {doctor.email && (
                              <div className="text-sm text-gray-500">{doctor.email}</div>
                            )}
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            doctor.is_active ? 'bg-green-400' : 'bg-gray-300'
                          }`} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any notes for the doctor about this appointment..."
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
                    setShowAssignmentModal(false);
                    setSelectedAppointment(null);
                    setSelectedDoctor('');
                    setAssignmentNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignDoctor}
                  disabled={!selectedDoctor || actionLoading || doctors.length === 0}
                  loading={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Assign Doctor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
