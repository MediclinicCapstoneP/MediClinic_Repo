import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building, 
  Filter, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { 
  AppointmentWithDetails, 
  AppointmentStatus, 
  AppointmentType,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_PRIORITY_COLORS,
  APPOINTMENT_PRIORITIES
} from '../../types/appointments';
import { authService } from '../../features/auth/utils/authService';
import { mockAppointments } from '../../utils/mockAppointments';

interface PatientAppointmentsProps {
  onNavigate?: (tab: string) => void;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ onNavigate }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchUserAndAppointments = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const user = await authService.getCurrentUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }
        setCurrentUser(user);

        // Fetch appointments for the current user
        const userAppointments = await AppointmentService.getAppointmentsWithDetails({
          patient_id: user.id
        });

        console.log('Fetched appointments:', userAppointments);
        
        // If no appointments found, use mock data for demonstration
        if (userAppointments.length === 0) {
          console.log('No appointments found, using mock data for demonstration');
          setAppointments(mockAppointments);
          setFilteredAppointments(mockAppointments);
        } else {
          setAppointments(userAppointments);
          setFilteredAppointments(userAppointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Fallback to mock data on error
        console.log('Using mock data due to error');
        setAppointments(mockAppointments);
        setFilteredAppointments(mockAppointments);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAppointments();
  }, []);

  useEffect(() => {
    // Filter appointments based on search and filters
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.clinic?.clinic_name?.toLowerCase().includes(searchLower) ||
        appointment.doctor_name?.toLowerCase().includes(searchLower) ||
        appointment.appointment_type?.toLowerCase().includes(searchLower) ||
        appointment.patient_notes?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.appointment_type === typeFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(appointment => appointment.appointment_date === dateFilter);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, typeFilter, dateFilter]);

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
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-600" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const result = await AppointmentService.cancelAppointment(appointmentId, 'Cancelled by patient');
      if (result) {
        // Refresh appointments
        const updatedAppointments = appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as AppointmentStatus } : apt
        );
        setAppointments(updatedAppointments);
        alert('Appointment cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return filteredAppointments.filter(apt => 
      apt.appointment_date >= today && 
      apt.status !== 'cancelled' && 
      apt.status !== 'completed'
    ).slice(0, 3);
  };

  const getPastAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return filteredAppointments.filter(apt => 
      apt.appointment_date < today || 
      apt.status === 'cancelled' || 
      apt.status === 'completed'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-theme mx-auto mb-4" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage your upcoming and past appointments
          </p>
        </div>
       
      </div>

      

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-theme" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(apt => 
                    apt.appointment_date >= new Date().toISOString().split('T')[0] && 
                    apt.status !== 'cancelled' && 
                    apt.status !== 'completed'
                  ).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {appointments.filter(apt => apt.status === 'cancelled').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {getUpcomingAppointments().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getUpcomingAppointments().map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(appointment.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}>
                        {APPOINTMENT_STATUSES[appointment.status]}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDate(appointment.appointment_date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatTime(appointment.appointment_time)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.clinic?.clinic_name || 'Clinic Name'}
                      </span>
                    </div>

                    {appointment.doctor_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Dr. {appointment.doctor_name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {APPOINTMENT_TYPES[appointment.appointment_type]}
                      </span>
                      {appointment.priority && (
                        <span className={`text-xs px-2 py-1 rounded ${APPOINTMENT_PRIORITY_COLORS[appointment.priority]}`}>
                          {APPOINTMENT_PRIORITIES[appointment.priority]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {getPastAppointments().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
          <div className="space-y-4">
            {getPastAppointments().map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}>
                          {APPOINTMENT_STATUSES[appointment.status]}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {formatDate(appointment.appointment_date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {formatTime(appointment.appointment_time)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {appointment.clinic?.clinic_name || 'Clinic Name'}
                          </span>
                        </div>

                        {appointment.doctor_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Dr. {appointment.doctor_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Appointments */}
      {filteredAppointments.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter
                ? 'Try adjusting your filters or search terms.'
                : 'You don\'t have any appointments yet.'
              }
            </p>
            <Button 
              onClick={() => onNavigate?.('nearby')}
              className="bg-theme hover:bg-theme-dark text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Your First Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedAppointment.status)}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[selectedAppointment.status]}`}>
                    {APPOINTMENT_STATUSES[selectedAppointment.status]}
                  </span>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-gray-900">{formatDate(selectedAppointment.appointment_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <p className="text-gray-900">{formatTime(selectedAppointment.appointment_time)}</p>
                  </div>
                </div>

                {/* Clinic and Doctor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
                    <p className="text-gray-900">{selectedAppointment.clinic?.clinic_name || 'N/A'}</p>
                    {selectedAppointment.clinic?.address && (
                      <p className="text-sm text-gray-600">{selectedAppointment.clinic.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                    <p className="text-gray-900">
                      {selectedAppointment.doctor_name ? `Dr. ${selectedAppointment.doctor_name}` : 'TBD'}
                    </p>
                    {selectedAppointment.doctor_specialty && (
                      <p className="text-sm text-gray-600">{selectedAppointment.doctor_specialty}</p>
                    )}
                  </div>
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {APPOINTMENT_TYPES[selectedAppointment.appointment_type]}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    {selectedAppointment.priority && (
                      <span className={`inline-block px-2 py-1 rounded text-sm ${APPOINTMENT_PRIORITY_COLORS[selectedAppointment.priority]}`}>
                        {APPOINTMENT_PRIORITIES[selectedAppointment.priority]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{selectedAppointment.duration_minutes} minutes</p>
                </div>

                {/* Notes */}
                {selectedAppointment.patient_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedAppointment.patient_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed' ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleCancelAppointment(selectedAppointment.id);
                        setShowDetails(false);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel Appointment
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 