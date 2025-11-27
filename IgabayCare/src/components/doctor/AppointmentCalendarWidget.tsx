import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, User, 
  Plus, Edit, Trash2, CheckCircle, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface AppointmentCalendarWidgetProps {
  doctorId: string;
  appointments?: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onAddAppointment?: (date: string, time: string) => void;
  className?: string;
}

export const AppointmentCalendarWidget: React.FC<AppointmentCalendarWidgetProps> = ({
  doctorId,
  appointments = [],
  onAppointmentClick,
  onAddAppointment,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  // Mock appointments for demonstration
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      patientName: 'Sarah Johnson',
      patientId: 'p1',
      date: '2024-01-15',
      time: '09:00',
      duration: 30,
      type: 'General Checkup',
      status: 'confirmed',
      notes: 'Follow-up for blood pressure',
      priority: 'medium'
    },
    {
      id: '2',
      patientName: 'Michael Chen',
      patientId: 'p2',
      date: '2024-01-15',
      time: '10:30',
      duration: 45,
      type: 'Consultation',
      status: 'scheduled',
      notes: 'New patient consultation',
      priority: 'high'
    },
    {
      id: '3',
      patientName: 'Emily Davis',
      patientId: 'p3',
      date: '2024-01-15',
      time: '14:00',
      duration: 20,
      type: 'Follow-up',
      status: 'confirmed',
      notes: 'Prescription review',
      priority: 'low'
    },
    {
      id: '4',
      patientName: 'John Smith',
      patientId: 'p4',
      date: '2024-01-16',
      time: '11:00',
      duration: 30,
      type: 'Routine Check',
      status: 'scheduled',
      priority: 'medium'
    }
  ];

  const allAppointments = appointments.length > 0 ? appointments : mockAppointments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const getAppointmentsForDate = (date: string) => {
    return allAppointments.filter(apt => apt.date === date);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    
    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-1 border rounded-lg overflow-hidden">
          {/* Day Headers */}
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayAppointments = getAppointmentsForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div key={index} className="bg-gray-50 border-b">
                <div className={`p-3 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-500 uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {dayAppointments.length} apt{dayAppointments.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Day Appointments */}
                <div className="p-2 space-y-1 min-h-[200px]">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-2 rounded text-xs cursor-pointer border-l-2 ${getPriorityColor(appointment.priority || 'medium')} ${getStatusColor(appointment.status)}`}
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      <div className="font-medium">{appointment.time}</div>
                      <div className="truncate">{appointment.patientName}</div>
                      <div className="text-xs opacity-75">{appointment.type}</div>
                    </div>
                  ))}
                  
                  {/* Add appointment button */}
                  <button
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    onClick={() => onAddAppointment?.(dateStr, '09:00')}
                  >
                    <Plus className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayAppointments = getAppointmentsForDate(dateStr);
    
    return (
      <div className="space-y-4">
        {/* Day Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() - 1);
              setCurrentDate(newDate);
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">{formatDate(currentDate)}</h3>
            <Button variant="outline" size="sm" onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() + 1);
              setCurrentDate(newDate);
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewMode('week')}>
            Back to Week
          </Button>
        </div>

        {/* Time Slots */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {timeSlots.map((time) => {
            const appointment = dayAppointments.find(apt => apt.time === time);
            
            return (
              <div key={time} className="flex items-center gap-4 p-2 border-b border-gray-100">
                <div className="w-16 text-sm text-gray-500 font-mono">{time}</div>
                <div className="flex-1">
                  {appointment ? (
                    <div
                      className={`p-3 rounded-lg border cursor-pointer ${getStatusColor(appointment.status)} ${getPriorityColor(appointment.priority || 'medium')}`}
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{appointment.patientName}</div>
                          <div className="text-sm opacity-75">{appointment.type}</div>
                          {appointment.notes && (
                            <div className="text-xs mt-1 opacity-60">{appointment.notes}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {appointment.duration}min
                          </Badge>
                          {appointment.priority === 'high' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      onClick={() => onAddAppointment?.(dateStr, time)}
                    >
                      <Plus className="h-4 w-4 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Calendar
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'week' ? renderWeekView() : renderDayView()}
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendarWidget;
