import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { enhancedPatientService } from '../../features/auth/utils/enhancedPatientService';
import type { AppointmentWithDetails, AppointmentStatus } from '../../types/appointments';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  User,
  CalendarDays,
  List,
  Filter,
  AlertCircle
} from 'lucide-react';

interface AppointmentCalendarViewProps {
  patientId: string;
}

type ViewMode = 'month' | 'week' | 'list';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: AppointmentWithDetails[];
  dayNumber: number;
}

const APPOINTMENT_STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-orange-100 text-orange-800 border-orange-200'
};

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({ patientId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');

  // Load appointments for the current date range
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await enhancedPatientService.getPatientAppointmentHistory(patientId);
      
      if (result.success && result.appointments) {
        // Filter appointments based on current view
        const filteredAppointments = result.appointments.filter(apt => {
          if (statusFilter !== 'all' && apt.status !== statusFilter) {
            return false;
          }
          
          const appointmentDate = new Date(apt.appointment_date);
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          if (viewMode === 'month') {
            // Show appointments within 2 months of current view
            const monthDiff = Math.abs(appointmentDate.getMonth() - currentMonth) + 
                            Math.abs(appointmentDate.getFullYear() - currentYear) * 12;
            return monthDiff <= 1;
          }
          
          return true; // For week and list view, show all
        });
        
        setAppointments(filteredAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, currentDate, viewMode, statusFilter]);

  useEffect(() => {
    if (patientId) {
      loadAppointments();
    }
  }, [loadAppointments, patientId]);

  // Generate calendar days for month view
  const generateCalendarDays = useCallback((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      // Find appointments for this date
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.toDateString() === date.toDateString();
      });

      days.push({
        date: new Date(date),
        isCurrentMonth,
        isToday,
        appointments: dayAppointments,
        dayNumber: date.getDate()
      });
    }

    return days;
  }, [currentDate, appointments]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get upcoming appointments for quick view
  const getUpcomingAppointments = () => {
    const today = new Date();
    return appointments
      .filter(apt => new Date(apt.appointment_date) >= today)
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
      .slice(0, 5);
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600">View and manage your appointment schedule</p>
        </div>

        {/* View mode and filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={16} className="inline mr-1" />
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} className="inline mr-1" />
              List
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(null);
                  }}
                  className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`
                    min-h-[80px] p-1 border border-gray-100 cursor-pointer transition-colors
                    ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                    ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                    ${selectedDate && selectedDate.toDateString() === day.date.toDateString() ? 'ring-2 ring-primary-500' : ''}
                  `}
                >
                  <div className={`text-sm ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day.dayNumber}
                  </div>
                  <div className="space-y-1 mt-1">
                    {day.appointments.slice(0, 2).map((apt, i) => (
                      <div
                        key={apt.id}
                        className={`text-xs px-1 py-0.5 rounded text-center truncate ${
                          APPOINTMENT_STATUS_COLORS[apt.status]
                        }`}
                      >
                        {formatTime(apt.appointment_time)}
                      </div>
                    ))}
                    {day.appointments.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.appointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Appointment List</h3>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600">Your appointments will appear here once you book them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            APPOINTMENT_STATUS_COLORS[appointment.status]
                          }`}>
                            {appointment.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {appointment.appointment_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {appointment.clinic?.clinic_name}
                        </h4>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(new Date(appointment.appointment_date))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                        
                        {appointment.clinic && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin size={14} />
                            {appointment.clinic.city}, {appointment.clinic.state}
                          </div>
                        )}
                        
                        {appointment.doctor_name && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <User size={14} />
                            Dr. {appointment.doctor_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected date details */}
      {selectedDate && viewMode === 'month' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Appointments for {formatDate(selectedDate)}
            </h3>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayAppointments = appointments.filter(apt => 
                new Date(apt.appointment_date).toDateString() === selectedDate.toDateString()
              );
              
              return dayAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600">No appointments on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{apt.clinic?.clinic_name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatTime(apt.appointment_time)} • {apt.appointment_type.replace('_', ' ')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        APPOINTMENT_STATUS_COLORS[apt.status]
                      }`}>
                        {apt.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(apt => apt.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(apt => apt.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {appointments.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentCalendarView;
