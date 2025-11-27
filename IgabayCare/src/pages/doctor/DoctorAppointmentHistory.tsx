import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../supabaseClient';
import { 
  Calendar, Clock, User, Stethoscope, FileText, Filter, Search, Eye,
  CheckCircle, XCircle, AlertCircle, MapPin, Phone, Mail, Download,
  TrendingUp, TrendingDown, Users, Activity, RefreshCw, ChevronLeft,
  ChevronRight, MoreHorizontal, ExternalLink, Copy, Star
} from 'lucide-react';
import { 
  AppointmentWithDetails, 
  AppointmentStatus
} from '../../types/appointments';

// Constants for appointment types
const APPOINTMENT_TYPES: { [key: string]: string } = {
  'consultation': 'Consultation',
  'routine_checkup': 'Routine Checkup',
  'follow_up': 'Follow Up',
  'emergency': 'Emergency',
  'specialist_visit': 'Specialist Visit',
  'vaccination': 'Vaccination',
  'procedure': 'Procedure',
  'surgery': 'Surgery',
  'lab_test': 'Lab Test',
  'imaging': 'Imaging',
  'physical_therapy': 'Physical Therapy',
  'mental_health': 'Mental Health',
  'dental': 'Dental',
  'vision': 'Vision',
  'other': 'Other'
};

interface DoctorAppointmentHistoryProps {
  doctorId: string;
}

interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  averageDuration: number;
}

export const DoctorAppointmentHistory: React.FC<DoctorAppointmentHistoryProps> = ({ doctorId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);

  useEffect(() => {
    if (doctorId) {
      loadAppointmentHistory();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  const loadAppointmentHistory = async () => {
    if (!doctorId || doctorId === '') {
      console.warn('No doctorId provided to loadAppointmentHistory');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load all appointments for the doctor with patient details
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone, date_of_birth, blood_type),
          clinic:clinics(id, clinic_name, address, city, state, phone)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (appointmentsError) {
        console.error('Error loading appointments:', appointmentsError);
        return;
      }

      if (appointmentsData) {
        // Filter to show only historical appointments (past dates and completed/cancelled)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Include today's appointments
        
        const historicalAppointments = appointmentsData.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date);
          
          // Include past appointments or appointments with final status
          return appointmentDate < today || 
                 ['completed', 'cancelled'].includes(apt.status);
        });
        
        // Transform data to match expected format
        const transformedAppointments: AppointmentWithDetails[] = historicalAppointments.map(apt => ({
          ...apt,
          patient_name: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : apt.patient_name || 'Unknown Patient',
          duration_minutes: apt.duration_minutes || 30,
        }));
        
        setAppointments(transformedAppointments);
        calculateStats(transformedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentList: AppointmentWithDetails[]) => {
    const total = appointmentList.length;
    const completed = appointmentList.filter(apt => apt.status === 'completed').length;
    const cancelled = appointmentList.filter(apt => apt.status === 'cancelled').length;
    const noShow = appointmentList.filter(apt => apt.status === 'no_show').length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const averageDuration = appointmentList.reduce((sum, apt) => sum + (apt.duration_minutes || 30), 0) / (total || 1);

    setStats({
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      completionRate,
      averageDuration
    });
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.patient?.first_name?.toLowerCase() + ' ' + apt.patient?.last_name?.toLowerCase()).includes(searchQuery.toLowerCase()) ||
        apt.appointment_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(apt => apt.appointment_date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(apt => apt.appointment_date <= filterDateTo);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleViewDetails = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
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

  const getStatusConfig = (status: string) => {
    const configs = {
      'scheduled': { 
        class: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Clock, 
        text: 'Scheduled' 
      },
      'confirmed': { 
        class: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: CheckCircle, 
        text: 'Confirmed' 
      },
      'completed': { 
        class: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Completed' 
      },
      'cancelled': { 
        class: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        text: 'Cancelled' 
      },
      'no_show': { 
        class: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: AlertCircle, 
        text: 'No Show' 
      },
      'rescheduled': { 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Calendar, 
        text: 'Rescheduled' 
      }
    };
    return configs[status as keyof typeof configs] || configs.scheduled;
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-1.5">
        <IconComponent className="h-3.5 w-3.5" />
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.class}`}>
          {config.text}
        </span>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setShowFilters(false);
  };

  // Pagination
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width={250} height={32} />
          <div className="flex gap-2">
            <Skeleton width={120} height={40} />
            <Skeleton width={100} height={40} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton width="100%" height={80} />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (!doctorId || doctorId === '') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
        </div>
        
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Doctor Profile</h3>
          <p className="text-gray-600">
            Please wait while we load your doctor profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
          <p className="text-gray-600 mt-1">Review your past appointments and patient consultations</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={loadAppointmentHistory} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedAppointments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageDuration)}min</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              
              <Input
                type="date"
                placeholder="From Date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
              
              <Input
                type="date"
                placeholder="To Date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointment history found</h3>
                    <p className="text-gray-600">
                      {searchQuery || filterStatus !== 'all' || filterDateFrom || filterDateTo
                        ? 'Try adjusting your search filters.'
                        : 'You have no past appointments yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                currentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient_name || 
                             (appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 
                              appointment.patient_id ? `Patient ID: ${appointment.patient_id.substring(0, 8)}` : 'Unknown Patient')}
                          </div>
                          {appointment.patient?.email && (
                            <div className="text-sm text-gray-500">
                              {appointment.patient.email}
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
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {APPOINTMENT_TYPES[appointment.appointment_type] || appointment.appointment_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.duration_minutes || 30} minutes
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleViewDetails(appointment)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstAppointment + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastAppointment, filteredAppointments.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAppointments.length}</span> results
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Appointment Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAppointment.patient_name || 
                   (selectedAppointment.patient ? 
                     `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 
                     (selectedAppointment.patient_id ? `Patient ID: ${selectedAppointment.patient_id.substring(0, 8)}` : 'Unknown Patient'))}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedAppointment.appointment_date)} at {formatTime(selectedAppointment.appointment_time)}
                </p>
              </div>
              <div className="ml-auto">
                {getStatusBadge(selectedAppointment.status)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Appointment Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Type</p>
                      <p className="text-sm text-gray-600">
                        {APPOINTMENT_TYPES[selectedAppointment.appointment_type] || selectedAppointment.appointment_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.duration_minutes || 30} minutes</p>
                    </div>
                  </div>
                  {selectedAppointment.payment_amount && (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs text-green-600">₱</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment</p>
                        <p className="text-sm text-green-600 font-medium">
                          ₱{selectedAppointment.payment_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Patient Contact</h4>
                <div className="space-y-3">
                  {selectedAppointment.patient?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{selectedAppointment.patient.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedAppointment.patient?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{selectedAppointment.patient.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedAppointment.clinic && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Clinic</p>
                        <p className="text-sm text-gray-600">{selectedAppointment.clinic.clinic_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {(selectedAppointment.notes || selectedAppointment.doctor_notes) && (
              <div className="space-y-4">
                {selectedAppointment.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Patient Notes</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}
                {selectedAppointment.doctor_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Doctor Notes</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">{selectedAppointment.doctor_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};