import React, { useState, useEffect } from 'react';
import { AppointmentDisplay, getAppointmentWithPatientName } from '../../utils/appointmentDisplayUtils';
import { Card } from '../ui/Card';
import { Badge } from '../ui/badge';

interface AppointmentWithPatientDisplayProps {
  appointmentId: string;
  showFullDetails?: boolean;
  className?: string;
}

export const AppointmentWithPatientDisplay: React.FC<AppointmentWithPatientDisplayProps> = ({
  appointmentId,
  showFullDetails = true,
  className = ''
}) => {
  const [appointment, setAppointment] = useState<AppointmentDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const appointmentData = await getAppointmentWithPatientName(appointmentId);
        
        if (appointmentData) {
          setAppointment(appointmentData);
        } else {
          setError('Appointment not found');
        }
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 border-red-200 ${className}`}>
        <div className="text-red-600 text-sm">
          <p className="font-medium">Error loading appointment</p>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-gray-500 text-sm">
          No appointment data available
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {appointment.patientName}
            </h3>
            <p className="text-sm text-gray-600">{appointment.patientEmail}</p>
            {appointment.patientPhone && (
              <p className="text-sm text-gray-600">{appointment.patientPhone}</p>
            )}
          </div>
          <Badge className={getStatusBadgeColor(appointment.status)}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium">{formatTime(appointment.appointmentTime)}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium capitalize">{appointment.appointmentType.replace('_', ' ')}</p>
          </div>
          {appointment.doctorName && (
            <div>
              <p className="text-gray-500">Doctor</p>
              <p className="font-medium">{appointment.doctorName}</p>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {showFullDetails && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Clinic</p>
                <p className="font-medium">{appointment.clinicName}</p>
              </div>
              <div>
                <p className="text-gray-500">Appointment ID</p>
                <p className="font-mono text-xs text-gray-600">{appointment.appointmentId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AppointmentWithPatientDisplay;