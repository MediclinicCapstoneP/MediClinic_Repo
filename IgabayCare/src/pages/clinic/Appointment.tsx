import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { AppointmentServicesService } from '../../features/auth/utils/appointmentServicesService';
import { doctorService, DoctorProfile } from '../../features/auth/utils/doctorService';
import { DoctorAppointmentService } from '../../services/doctorAppointmentService';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../supabaseClient';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserPlus,
  DollarSign,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Eye,
  Stethoscope,
  AlertCircle,
  TrendingUp
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

interface AppointmentProps {
  clinicId: string;
}

export const Appointment: React.FC<AppointmentProps> = ({ clinicId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointmentServices, setAppointmentServices] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    pendingAssignment: 0
  });

  useEffect(() => {
    if (clinicId) {
      loadAppointments();
      loadDoctors();
    }
  }, [clinicId, filterStatus, filterDate]);

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

      // Load services for each appointment
      const servicesMap: Record<string, string[]> = {};
      await Promise.all(
        appointmentsData.map(async (appointment) => {
          try {
            const services = await AppointmentServicesService.getAppointmentServicesDisplay(
              appointment.id,
              appointment.appointment_type,
              appointment.clinic_id
            );
            servicesMap[appointment.id] = services;
          } catch (error) {
            console.warn(`Error loading services for appointment ${appointment.id}:`, error);
            servicesMap[appointment.id] = AppointmentServicesService.formatServicesDisplay([]).split(', ');
          }
        })
      );
      setAppointmentServices(servicesMap);
      
      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      setStats({
        total: appointmentsData.length,
        scheduled: appointmentsData.filter(a => a.status === 'scheduled').length,
        confirmed: appointmentsData.filter(a => a.status === 'confirmed').length,
        completed: appointmentsData.filter(a => a.status === 'completed').length,
        cancelled: appointmentsData.filter(a => a.status === 'cancelled').length,
        today: appointmentsData.filter(a => a.appointment_date === today).length,
        pendingAssignment: appointmentsData.filter(a => !a.doctor_id).length
      });
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
      
      // 1. Update the main appointment with doctor info
      await AppointmentService.updateAppointment(selectedAppointment.id, {
        doctor_id: selectedDoctorId,
        doctor_name: selectedDoctor?.full_name || '',
        doctor_specialty: selectedDoctor?.specialization || ''
      });
      
      // 2. Create doctor appointment in the doctor_appointments table
      console.log('🎆 Creating doctor appointment for assignment...');
      
      // Get patient information from the appointment
      const patientName = selectedAppointment.patient_name || 
        (selectedAppointment.patient 
          ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`.trim()
          : 'Unknown Patient');
      
      const patientEmail = selectedAppointment.patient?.email || '';
      const patientPhone = selectedAppointment.patient?.phone || '';
      
      // If patient info is not in the appointment object, fetch it directly
      let finalPatientName = patientName;
      let finalPatientEmail = patientEmail;
      let finalPatientPhone = patientPhone;
      
      // Always fetch patient data to ensure we have the latest information
      if (selectedAppointment.patient_id) {
        try {
          const { data: patientData } = await supabase
            .from('patients')
            .select('first_name, last_name, email, phone')
            .eq('id', selectedAppointment.patient_id)
            .single();
          
          if (patientData) {
            finalPatientName = `${patientData.first_name} ${patientData.last_name}`.trim() || patientName || 'Unknown Patient';
            finalPatientEmail = patientData.email || '';
            finalPatientPhone = patientData.phone || '';
            console.log('✅ Fetched patient data:', { finalPatientName, finalPatientEmail, finalPatientPhone });
          } else {
            console.warn('⚠️ Patient data not found for ID:', selectedAppointment.patient_id);
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch patient details:', error);
        }
      } else {
        console.warn('⚠️ No patient_id in appointment:', selectedAppointment.id);
      }
      
      // Use payment_amount if available, otherwise use total_amount (if it exists)
      const paymentAmount = selectedAppointment.payment_amount || 
                           (selectedAppointment as any).total_amount || 
                           0;
      
      console.log('📋 Passing patient info to doctor appointment:', {
        patient_name: finalPatientName,
        patient_email: finalPatientEmail,
        patient_phone: finalPatientPhone,
        patient_id: selectedAppointment.patient_id
      });
      
      const doctorAppointmentResult = await DoctorAppointmentService.createDoctorAppointment({
        doctor_id: selectedDoctorId,
        appointment_id: selectedAppointment.id,
        patient_id: selectedAppointment.patient_id,
        clinic_id: selectedAppointment.clinic_id,
        appointment_date: selectedAppointment.appointment_date,
        appointment_time: selectedAppointment.appointment_time,
        appointment_type: selectedAppointment.appointment_type,
        duration_minutes: selectedAppointment.duration_minutes || 30,
        payment_amount: paymentAmount,
        priority: selectedAppointment.priority || 'normal',
        patient_name: finalPatientName || 'Unknown Patient',
        patient_email: finalPatientEmail || '',
        patient_phone: finalPatientPhone || ''
      });
      
      if (doctorAppointmentResult.success && doctorAppointmentResult.appointment) {
        console.log('✅ Doctor appointment created successfully!');
        
        // Always update patient info to ensure it's set (even if it was set initially)
        const createdAppointment = doctorAppointmentResult.appointment;
        try {
          const updateResult = await supabase
            .from('doctor_appointments')
            .update({
              patient_name: finalPatientName || 'Unknown Patient',
              patient_email: finalPatientEmail || null,
              patient_phone: finalPatientPhone || null
            })
            .eq('id', createdAppointment.id)
            .select('patient_name, patient_email, patient_phone')
            .single();
          
          if (updateResult.error) {
            console.warn('⚠️ Failed to update patient info:', updateResult.error);
          } else {
            console.log('✅ Patient info updated in doctor appointment:', {
              patient_name: updateResult.data?.patient_name,
              patient_email: updateResult.data?.patient_email,
              patient_phone: updateResult.data?.patient_phone
            });
          }
        } catch (updateError) {
          console.warn('⚠️ Failed to update patient info (non-critical):', updateError);
        }
      } else {
        console.error('❌ Error creating doctor appointment:', doctorAppointmentResult.error);
        // Still continue - the main appointment assignment worked
      }
      
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

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(appointment => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const patientName = appointment.patient_name || 
        (appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : '');
      const matchesSearch = 
        patientName.toLowerCase().includes(query) ||
        appointment.patient?.email?.toLowerCase().includes(query) ||
        appointment.appointment_type?.toLowerCase().includes(query) ||
        appointment.doctor_name?.toLowerCase().includes(query) ||
        appointment.notes?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(filterDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setFilterDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setFilterDate(new Date().toISOString().split('T')[0]);
  };

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Appointments Management
          </h1>
          <p className="text-gray-600">View and manage all clinic appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadAppointments}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Scheduled</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Completed</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Today</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Unassigned</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pendingAssignment}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm font-medium text-blue-800 cursor-pointer"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2"
              >
                Today
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, email, doctor, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
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
      ) : filteredAppointments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">
              {appointments.length === 0
                ? `No appointments scheduled for ${new Date(filterDate).toLocaleDateString()}`
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => {
                  const patientName = appointment.patient_name || 
                    (appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Unknown Patient');
                  return (
                    <tr
                      key={appointment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patientName}</div>
                            {appointment.patient?.email && (
                              <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatDate(appointment.appointment_date)}</div>
                          <div className="text-sm text-gray-500">{formatTime(appointment.appointment_time)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {APPOINTMENT_TYPES[appointment.appointment_type] || appointment.appointment_type}
                          </div>
                          {appointmentServices[appointment.id] && appointmentServices[appointment.id].length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {appointmentServices[appointment.id].slice(0, 2).join(', ')}
                              {appointmentServices[appointment.id].length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.doctor_name ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.doctor_name}</div>
                            {appointment.doctor_specialty && (
                              <div className="text-sm text-gray-500">{appointment.doctor_specialty}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-orange-600 font-medium">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-green-700">
                            ₱{appointment.payment_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(appointment as any).payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(appointment.status)}
                          {appointment.priority && getPriorityBadge(appointment.priority)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="h-7 px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignDoctor(appointment)}
                            className="h-7 px-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          {appointment.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmAppointment(appointment)}
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this appointment?')) {
                                  AppointmentService.updateAppointment(appointment.id, { status: 'cancelled' })
                                    .then(() => loadAppointments());
                                }
                              }}
                              className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          title="Appointment Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Patient Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.patient_name || 
                     (selectedAppointment.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient')}
                  </p>
                </div>
                {selectedAppointment.patient?.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedAppointment.patient.email}</p>
                  </div>
                )}
                {selectedAppointment.patient?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedAppointment.patient.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium text-gray-900">{formatDate(selectedAppointment.appointment_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time</p>
                <p className="font-medium text-gray-900">{formatTime(selectedAppointment.appointment_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-medium text-gray-900">
                  {APPOINTMENT_TYPES[selectedAppointment.appointment_type] || selectedAppointment.appointment_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="font-medium text-gray-900">{selectedAppointment.duration_minutes || 30} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                {getStatusBadge(selectedAppointment.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment</p>
                <p className="font-medium text-green-700">
                  ₱{selectedAppointment.payment_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs text-gray-500">
                  Status: {(selectedAppointment as any).payment_status || 'Pending'}
                </p>
              </div>
            </div>

            {/* Doctor Assignment */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Assigned Doctor</p>
              {selectedAppointment.doctor_name ? (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedAppointment.doctor_name}</p>
                    {selectedAppointment.doctor_specialty && (
                      <p className="text-sm text-gray-600">{selectedAppointment.doctor_specialty}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">No doctor assigned yet</p>
                </div>
              )}
            </div>

            {/* Services */}
            {appointmentServices[selectedAppointment.id] && appointmentServices[selectedAppointment.id].length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Requested Services</p>
                <div className="flex flex-wrap gap-2">
                  {appointmentServices[selectedAppointment.id].map((service, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedAppointment.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Patient Notes</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAssignDoctor(selectedAppointment);
                }}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {selectedAppointment.doctor_id ? 'Change Doctor' : 'Assign Doctor'}
              </Button>
              {selectedAppointment.status === 'scheduled' && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleConfirmAppointment(selectedAppointment);
                  }}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Appointment
                </Button>
              )}
              {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this appointment?')) {
                      AppointmentService.updateAppointment(selectedAppointment.id, { status: 'cancelled' })
                        .then(() => {
                          loadAppointments();
                          setShowDetailsModal(false);
                          setSelectedAppointment(null);
                        });
                    }
                  }}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Appointment Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmAppointment}
        title="Confirm Appointment"
        message={`Are you sure you want to confirm the appointment for ${
          selectedAppointment?.patient_name ||
          (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient')
        } on ${
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
