import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonTable } from '../../components/ui/Skeleton';
import {
  AppointmentWithDetails,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';
import { AppointmentService } from '../../features/auth/utils/appointmentService';

interface PatientHistoryProps {
  patientId: string;
}

const mockClinic = {
  clinic_name: 'QuickCare Medical Center',
  city: 'City Center',
  state: 'State'
};

const mockHistory: AppointmentWithDetails[] = [
  {
    id: 'mock-1',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    appointment_time: '10:30:00',
    appointment_type: 'general', // adjust according to your types map
    doctor_id: 'doc-1',
    doctor_name: 'Dr. Sarah Johnson',
    doctor_specialty: 'General Medicine',
    status: 'completed' as AppointmentStatus,
    priority: 'normal',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['General Medicine'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any, // not needed here
    // filler for other fields if your type requires them
  } as any,
  {
    id: 'mock-2',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    appointment_time: '14:00:00',
    appointment_type: 'follow_up',
    doctor_id: 'doc-2',
    doctor_name: 'Dr. Michael Lee',
    doctor_specialty: 'Cardiology',
    status: 'confirmed' as AppointmentStatus,
    priority: 'high',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['Cardiology'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any,
  {
    id: 'mock-3',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split('T')[0],
    appointment_time: '09:15:00',
    appointment_type: 'specialist',
    doctor_id: 'doc-3',
    doctor_name: 'Dr. Alice Reyes',
    doctor_specialty: 'Dermatology',
    status: 'cancelled' as AppointmentStatus,
    priority: 'low',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['Dermatology'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any,
  {
    id: 'mock-4',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    appointment_time: '11:45:00',
    appointment_type: 'general',
    doctor_id: '',
    doctor_name: '',
    doctor_specialty: '',
    status: 'no_show' as AppointmentStatus,
    priority: 'normal',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['General Medicine'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any
];

export const PatientHistory: React.FC<PatientHistoryProps> = ({ patientId }) => {
  const [history, setHistory] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {
        patient_id: patientId
      };
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterFrom) filters.appointment_date_from = filterFrom;
      if (filterTo) filters.appointment_date_to = filterTo;

      const data = await AppointmentService.getAppointmentsWithDetails(filters);
      setHistory(data || []);
    } catch (err) {
      console.error('Error loading patient history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filtered = history.filter((appt) => {
    if (searchText) {
      const clinicName = `${appt.clinic?.clinic_name ?? ''}`.toLowerCase();
      if (!clinicName.includes(searchText.toLowerCase())) return false;
    }
    return true;
  });

  const displayHistory = !loading && filtered.length === 0 ? mockHistory : filtered;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatTime = (t: string) =>
    new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

  const statusBadge = (status: AppointmentStatus) => {
    const statusClass = APPOINTMENT_STATUS_COLORS[status];
    const statusText = APPOINTMENT_STATUSES[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {statusText}
      </span>
    );
  };

  const priorityBadge = (priority: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">History</h2>
          <p className="text-gray-600">Your past appointments and their status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as AppointmentStatus | 'all')
              }
              className="px-3 py-2 border rounded-md focus:outline-none"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search Clinic
            </label>
            <input
              type="text"
              placeholder="Clinic name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void loadHistory()}>Apply</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No history found
                    </td>
                  </tr>
                ) : (
                  displayHistory.map((appt) => (
                    <tr key={appt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appt.clinic?.clinic_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appt.clinic?.city}, {appt.clinic?.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appt.appointment_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(appt.appointment_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {APPOINTMENT_TYPES[appt.appointment_type]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appt.doctor_name ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appt.doctor_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appt.doctor_specialty}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(appt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {priorityBadge(appt.priority)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
