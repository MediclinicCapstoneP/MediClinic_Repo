import React, { useState, useEffect } from 'react';
import { AppointmentHistoryService, AppointmentHistoryEntry } from '../../services/appointmentHistoryService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { 
  Calendar, Clock, User, Stethoscope, FileText, Pill, 
  MapPin, Phone, CheckCircle, Eye
} from 'lucide-react';

interface AppointmentHistoryProps {
  patientId: string;
}

export const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({ patientId }) => {
  const [history, setHistory] = useState<AppointmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<AppointmentHistoryEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadAppointmentHistory();
    }
  }, [patientId]);

  const loadAppointmentHistory = async () => {
    try {
      setLoading(true);
      const result = await AppointmentHistoryService.getPatientAppointmentHistory(patientId);
      
      if (result.success && result.history) {
        setHistory(result.history);
      } else {
        console.error('Error loading appointment history:', result.error);
        setHistory([]);
      }
    } catch (error) {
      console.error('Unexpected error loading appointment history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
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

  const handleViewDetails = (entry: AppointmentHistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton width={200} height={32} />
          <Skeleton width={100} height={40} />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton width={150} height={20} />
                <Skeleton width={80} height={16} />
              </div>
              <Skeleton width="100%" height={16} />
              <div className="flex gap-4">
                <Skeleton width={100} height={14} />
                <Skeleton width={120} height={14} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
        <Button onClick={loadAppointmentHistory} variant="outline">
          Refresh
        </Button>
      </div>

      {history.length === 0 ? (
        <Card className="p-8 text-center">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointment History</h3>
          <p className="text-gray-600">
            You don't have any completed appointments yet. Your appointment history will appear here after your visits.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <Card key={entry.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entry.appointment_type}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {entry.doctor_name} • {entry.clinic_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(entry.appointment_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(entry.appointment_time)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Completed: {formatDate(entry.completed_at)}</span>
                </div>
                {entry.prescription_given && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Pill className="h-4 w-4" />
                    <span>Prescription Given</span>
                  </div>
                )}
                {entry.follow_up_required && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Follow-up Required</span>
                  </div>
                )}
              </div>

              {entry.consultation_notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Consultation Notes:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {entry.consultation_notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => handleViewDetails(entry)}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Appointment Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedEntry.appointment_date)} at {formatTime(selectedEntry.appointment_time)}
                  </p>
                </div>
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Appointment Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Appointment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Type</p>
                        <p className="text-sm text-gray-600">{selectedEntry.appointment_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Doctor</p>
                        <p className="text-sm text-gray-600">{selectedEntry.doctor_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Clinic</p>
                        <p className="text-sm text-gray-600">{selectedEntry.clinic_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <p className="text-sm text-green-600 capitalize">{selectedEntry.status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {(selectedEntry.consultation_notes || selectedEntry.diagnosis || selectedEntry.treatment_plan) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Medical Information</h3>
                    <div className="space-y-3">
                      {selectedEntry.consultation_notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Consultation Notes</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                            {selectedEntry.consultation_notes}
                          </p>
                        </div>
                      )}
                      {selectedEntry.diagnosis && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Diagnosis</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                            {selectedEntry.diagnosis}
                          </p>
                        </div>
                      )}
                      {selectedEntry.treatment_plan && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Treatment Plan</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                            {selectedEntry.treatment_plan}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Pill className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Prescription</p>
                        <p className="text-sm text-gray-600">
                          {selectedEntry.prescription_given ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Follow-up Required</p>
                        <p className="text-sm text-gray-600">
                          {selectedEntry.follow_up_required ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedEntry.follow_up_required && selectedEntry.follow_up_date && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900">Follow-up Date</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedEntry.follow_up_date)}</p>
                      {selectedEntry.follow_up_notes && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">Follow-up Notes</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                            {selectedEntry.follow_up_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory;
