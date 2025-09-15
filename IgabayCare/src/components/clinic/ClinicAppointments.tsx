import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MoreHorizontal, CheckCircle, XCircle, UserPlus, DollarSign, Mail, AlertCircle, RefreshCw, Search, Filter, ChevronDown, ChevronUp, Activity, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Skeleton } from '../ui/Skeleton';
import { AssignDoctor } from './AssignDoctor';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService } from '../../features/auth/utils/clinicService';

export const ClinicAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0
  });

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
      console.log('🔍 Fetching appointments for clinic:', clinicId, 'date:', date);
      
      // First try the enhanced method
      let appointments = await AppointmentService.getClinicAppointmentsWithPatientDetails({
        clinic_id: clinicId,
        appointment_date: date
      });
      
      console.log('📋 Initial appointments fetched:', appointments?.length || 0);
      
      // If we don't have patient details, try the fallback method
      const hasPatientDetails = appointments?.some(apt => apt.patient?.full_name);
      console.log('👤 Has patient details:', hasPatientDetails);
      
      if (!hasPatientDetails && appointments && appointments.length > 0) {
        console.log('🔄 No patient details found, using name population fallback...');
        appointments = await AppointmentService.populatePatientNames(appointments);
        console.log('🎯 After name population:', appointments?.[0]?.patient_name);
      }
      
      // Process appointments using the enhanced resolution from AppointmentService
      const processedAppointments = (appointments || []).map(appointment => ({
        ...appointment,
        patient_display_name: AppointmentService.resolvePatientName(appointment)
      }));
      
      console.log('✅ Final processed appointments:', processedAppointments?.length || 0);
      console.log('👤 Sample patient name:', processedAppointments?.[0]?.patient_display_name);
      console.log('🔍 Sample appointment data:', {
        id: processedAppointments?.[0]?.id?.substring(0, 8),
        patient_name: processedAppointments?.[0]?.patient_name,
        patient_display_name: processedAppointments?.[0]?.patient_display_name,
        hasPatientObject: !!processedAppointments?.[0]?.patient,
        patientFields: processedAppointments?.[0]?.patient ? Object.keys(processedAppointments[0].patient) : []
      });
      
      setAppointments(processedAppointments || []);
      setFilteredAppointments(processedAppointments || []);
      
      // Calculate stats
      calculateStats(processedAppointments);
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Use the enhanced AppointmentService for patient name resolution
  
  const calculateStats = (appointments: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    setStats({
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      today: appointments.filter(a => a.appointment_date === today).length
    });
  };
  
  // Apply filters
  useEffect(() => {
    let filtered = [...appointments];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.patient_display_name?.toLowerCase().includes(query) ||
        appointment.appointment_type?.toLowerCase().includes(query) ||
        appointment.doctor_name?.toLowerCase().includes(query) ||
        appointment.patient?.email?.toLowerCase().includes(query) ||
        appointment.notes?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, searchQuery, statusFilter]);

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
    return appointment.patient_display_name || AppointmentService.resolvePatientName(appointment) || 'Unknown Patient';
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              Appointments
            </h1>
            <p className="text-gray-600">Manage your clinic's appointment schedule</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => clinicId && fetchAppointments(clinicId, selectedDate)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            
            {/* Debug button - remove in production */}
            <Button
              onClick={() => {
                console.log('🚀 DEBUG INFO:');
                console.log('📋 Raw appointments data:', appointments);
                console.log('🔍 Filtered appointments:', filteredAppointments);
                console.log('🏥 Clinic ID:', clinicId);
                console.log('📅 Selected date:', selectedDate);
                console.log('📊 Stats:', stats);
                
                if (appointments.length > 0) {
                  console.log('🔍 First appointment detailed:', appointments[0]);
                  console.log('👤 First appointment patient field:', appointments[0].patient);
                  console.log('📝 First appointment patient_name:', appointments[0].patient_name);
                }
              }}
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <AlertCircle size={16} className="mr-2" />
              Debug
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
            <div className="text-sm text-yellow-700">Scheduled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-green-700">Confirmed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <div className="text-sm text-purple-700">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-red-700">Cancelled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.today}</div>
            <div className="text-sm text-emerald-700">Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Selection & Filters */}
      <div className="mb-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Date Selection */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Date:</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, type, doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <div className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                  {filteredAppointments.length} results
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No appointments found
                </h3>
                <p className="text-gray-500 mb-4">
                  {appointments.length === 0 
                    ? `No appointments scheduled for ${new Date(selectedDate).toLocaleDateString()}`
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {appointments.length === 0 && (
                  <Button
                    onClick={() => clinicId && fetchAppointments(clinicId, selectedDate)}
                    variant="outline"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center space-x-6 flex-1">
                      {/* Time */}
                      <div className="bg-emerald-50 p-4 rounded-xl text-center min-w-[100px] border border-emerald-200">
                        <div className="text-xl font-bold text-emerald-800">
                          {formatTime(appointment.appointment_time)}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">
                          {appointment.duration_minutes || 30} min
                        </div>
                      </div>
                      
                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {getPatientName(appointment)}
                            </h3>
                            {appointment.patient?.email && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Mail size={14} className="mr-1" />
                                <span className="truncate">{appointment.patient.email}</span>
                              </div>
                            )}
                            {appointment.patient?.phone && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Phone size={14} className="mr-1" />
                                <span>{appointment.patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Appointment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        {/* Type */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Stethoscope size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {appointment.appointment_type || 'Consultation'}
                            </div>
                            <div className="text-xs text-gray-500">Service Type</div>
                          </div>
                        </div>
                        
                        {/* Doctor */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {getDoctorName(appointment)}
                            </div>
                            <div className="text-xs text-gray-500">Doctor</div>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Activity size={16} className="text-yellow-600" />
                          </div>
                          <div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Payment */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign size={16} className="text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-green-700">
                              {formatCurrency(appointment.payment_amount)}
                            </div>
                            <div className="text-xs text-gray-500">Booking Fee</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(appointment)}
                        className="flex items-center justify-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Activity size={14} />
                        <span className="hidden sm:inline">Details</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignDoctor(appointment)}
                        className="flex items-center justify-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <UserPlus size={14} />
                        <span className="hidden sm:inline">
                          {getDoctorName(appointment) !== 'Unassigned' ? 'Change Dr.' : 'Assign Dr.'}
                        </span>
                        <span className="sm:hidden">Dr.</span>
                      </Button>
                      
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkComplete(appointment.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} />
                          <span className="hidden sm:inline">Complete</span>
                        </Button>
                      )}
                      
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

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

      {/* AssignDoctor Modal */}
      {selectedAppointment && clinicId && (
        <AssignDoctor
          isOpen={showAssignDoctorModal}
          onClose={() => setShowAssignDoctorModal(false)}
          appointmentId={selectedAppointment.id}
          clinicId={clinicId}
          onAssignSuccess={handleAssignSuccess}
          currentDoctorId={selectedAppointment.doctor_id}
          currentDoctorName={getDoctorName(selectedAppointment)}
        />
      )}
    </div>
  );
};