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
// Import enhanced services
import { MedicalHistoryService } from '../../services/medicalHistoryService';
import { EnhancedHistoryService, EnhancedHistoryFilters } from '../../services/enhancedHistoryService';
import { PatientMedicalHistory } from '../../types/history';
import MedicalHistoryDashboard from '../../components/patient/MedicalHistoryDashboard';
import MedicalHistoryTimeline from '../../components/patient/MedicalHistoryTimeline';
import { enhancedPatientService } from '../../features/auth/utils/enhancedPatientService';
import { prescriptionService } from '../../services/prescriptionService';
import { Pill, BarChart3, Clock } from 'lucide-react';

interface PatientHistoryProps {
  patientId: string;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ patientId }) => {
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'timeline' | 'appointments'>('overview');
  // Keep existing appointment history state for backward compatibility
  const [history, setHistory] = useState<AppointmentWithDetails[]>([]);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [prescriptionCounts, setPrescriptionCounts] = useState<{ [appointmentId: string]: number }>({});

  // Enhanced comprehensive medical history loading function
  const loadComprehensiveMedicalHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading comprehensive medical history for patient:', patientId);
      
      // Build filters from current state
      const filters: EnhancedHistoryFilters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterFrom) filters.dateRange = { start: filterFrom, end: filterTo || new Date().toISOString().split('T')[0] };
      if (filterTo && !filterFrom) filters.dateRange = { start: '1900-01-01', end: filterTo };
      
      // Use enhanced service with better error handling and more data
      const result = await EnhancedHistoryService.getPatientHistory(patientId, filters);
      
      if (result.success && result.data) {
        setMedicalHistory(result.data);
        // Also set the appointment history for backward compatibility
        setHistory(result.data.appointments);
        console.log(`✅ Loaded comprehensive medical history with ${result.data.appointments.length} appointments`);
      } else {
        // Fallback to original service if enhanced fails
        console.warn('⚠️ Enhanced service failed, falling back to original service');
        const fallbackResult = await MedicalHistoryService.getPatientMedicalHistory(patientId);
        
        if (fallbackResult.success && fallbackResult.data) {
          setMedicalHistory(fallbackResult.data);
          setHistory(fallbackResult.data.appointments);
          console.log(`✅ Loaded fallback medical history with ${fallbackResult.data.appointments.length} appointments`);
        } else {
          setError(result.error || fallbackResult.error || 'Failed to load medical history');
          console.error('❌ Error loading medical history:', result.error || fallbackResult.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('❌ Unexpected error loading medical history:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, filterStatus, filterFrom, filterTo]);

  // Keep existing function for appointments-only view
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {
        patient_id: patientId
      };
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterFrom) filters.appointment_date_from = filterFrom;
      if (filterTo) filters.appointment_date_to = filterTo;

      console.log('🔍 Loading patient appointment history with filters:', filters);
      const result = await enhancedPatientService.getPatientAppointmentHistory(patientId);
      
      if (result.success && result.appointments) {
        // Apply additional filters if specified
        let filteredAppointments = result.appointments;
        
        if (filterStatus !== 'all') {
          filteredAppointments = filteredAppointments.filter((apt: any) => apt.status === filterStatus);
        }
        
        if (filterFrom) {
          filteredAppointments = filteredAppointments.filter((apt: any) => apt.appointment_date >= filterFrom);
        }
        
        if (filterTo) {
          filteredAppointments = filteredAppointments.filter((apt: any) => apt.appointment_date <= filterTo);
        }
        
        console.log(`✅ Found ${filteredAppointments.length} appointments for patient`);
        setHistory(filteredAppointments);
        
        // Load prescription counts for completed appointments
        loadPrescriptionCounts(filteredAppointments);
      } else {
        console.log('📝 No appointments found or error occurred:', result.error);
        setHistory([]);
      }
    } catch (err) {
      console.error('❌ Error loading patient history:', err);
      // Don't fall back to mock data on error - show empty state instead
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filterStatus, filterFrom, filterTo]);

  // Load prescription counts for appointments
  const loadPrescriptionCounts = async (appointments: AppointmentWithDetails[]) => {
    const counts: { [appointmentId: string]: number } = {};
    
    // Only load for completed appointments
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    for (const appointment of completedAppointments) {
      try {
        const result = await prescriptionService.getPrescriptionsByAppointment(appointment.id);
        if (result.success && result.prescriptions) {
          counts[appointment.id] = result.prescriptions.length;
        } else {
          counts[appointment.id] = 0;
        }
      } catch (error) {
        console.error(`Error loading prescriptions for appointment ${appointment.id}:`, error);
        counts[appointment.id] = 0;
      }
    }
    
    setPrescriptionCounts(counts);
  };

  useEffect(() => {
    if (activeView === 'overview' || activeView === 'timeline') {
      void loadComprehensiveMedicalHistory();
    } else {
      void loadHistory();
    }
  }, [loadComprehensiveMedicalHistory, loadHistory, activeView]);

  const filtered = history.filter((appt) => {
    if (searchText) {
      const clinicName = `${appt.clinic?.clinic_name ?? ''}`.toLowerCase();
      if (!clinicName.includes(searchText.toLowerCase())) return false;
    }
    return true;
  });

  const displayHistory = filtered;

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
          <h2 className="text-2xl font-bold">Medical History</h2>
          <p className="text-gray-600">Comprehensive overview of your medical records and health information.</p>
        </div>
        
        {/* View Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setActiveView('appointments')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'appointments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Pill className="w-4 h-4 mr-2" />
            Appointments
          </button>
        </div>
      </div>

      {/* Render content based on active view */}
      {activeView === 'overview' && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Medical History</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadComprehensiveMedicalHistory}>Retry</Button>
            </div>
          ) : medicalHistory ? (
            <MedicalHistoryDashboard 
              summary={medicalHistory.summary}
              loading={loading}
            />
          ) : null}
        </div>
      )}

      {activeView === 'timeline' && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Medical History</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadComprehensiveMedicalHistory}>Retry</Button>
            </div>
          ) : medicalHistory ? (
            <MedicalHistoryTimeline
              timelineItems={EnhancedHistoryService.generateHistoryTimeline(medicalHistory)}
              loading={loading}
            />
          ) : null}
        </div>
      )}

      {activeView === 'appointments' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Appointment History</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescriptions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-gray-400">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                          </svg>
                        </div>
                        <div className="text-gray-500">
                          <p className="text-lg font-medium">No appointment history found</p>
                          <p className="text-sm">Your past appointments will appear here once you book and complete them.</p>
                        </div>
                      </div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appt.status === 'completed' ? (
                          prescriptionCounts[appt.id] > 0 ? (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-medium mr-2">
                                {prescriptionCounts[appt.id]}
                              </div>
                              <Pill size={16} className="text-purple-600" />
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No Rx</span>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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
      )}
    </div>
  );
};
