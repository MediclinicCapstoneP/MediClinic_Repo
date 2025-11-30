/**
 * Prescription Viewer - Patient prescription viewing and download functionality
 * Displays prescriptions with professional formatting and download options
 */

import React, { useState, useEffect } from 'react';
import { enhancedBookingService } from '../../services/enhancedBookingService';
import { Button } from '../ui/Button';
import { 
  FileText, Download, Eye, Calendar, User, Phone, Mail, CheckCircle,
  AlertCircle, Loader2, RefreshCw, Filter, Search, Clock, Pill
} from 'lucide-react';

interface Prescription {
  id: string;
  prescription_number: string;
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  follow_up_date?: string;
  status: string;
  patient_viewed_at?: string;
  downloaded_at?: string;
  created_at: string;
  appointments: {
    appointment_date: string;
    appointment_time: string;
    clinics: {
      clinic_name: string;
      address?: string;
      phone?: string;
    };
    doctors: {
      first_name: string;
      last_name: string;
      specialization?: string;
    };
  };
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions?: string;
}

interface PrescriptionViewerProps {
  patientId: string;
  onRefresh?: () => void;
}

export const PrescriptionViewer: React.FC<PrescriptionViewerProps> = ({
  patientId,
  onRefresh
}) => {
  // State management
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load prescriptions
  const loadPrescriptions = async () => {
    try {
      const result = await enhancedBookingService.getPatientPrescriptions(patientId);
      if (result.success) {
        setPrescriptions(result.data || []);
      } else {
        console.error('Error loading prescriptions:', result.error);
        setError('Failed to load prescriptions');
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Failed to load prescriptions');
    }
  };

  // Mark prescription as viewed
  const markAsViewed = async (prescriptionId: string) => {
    try {
      const result = await enhancedBookingService.markPrescriptionAccess(prescriptionId, 'viewed');
      if (result.success) {
        // Update local state
        setPrescriptions(prev => prev.map(p => 
          p.id === prescriptionId 
            ? { ...p, patient_viewed_at: new Date().toISOString() }
            : p
        ));
      }
    } catch (error) {
      console.error('Error marking prescription as viewed:', error);
    }
  };

  // Download prescription
  const downloadPrescription = async (prescription: Prescription) => {
    setActionLoading(true);
    setError(null);

    try {
      // Mark as downloaded
      const result = await enhancedBookingService.markPrescriptionAccess(prescription.id, 'downloaded');
      if (result.success) {
        // Update local state
        setPrescriptions(prev => prev.map(p => 
          p.id === prescription.id 
            ? { ...p, downloaded_at: new Date().toISOString() }
            : p
        ));

        // Generate PDF content
        const pdfContent = generatePrescriptionPDF(prescription);
        
        // Create download
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription_${prescription.prescription_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setSuccess('Prescription downloaded successfully');
      } else {
        setError('Failed to download prescription');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      setError('Failed to download prescription');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate prescription PDF content
  const generatePrescriptionPDF = (prescription: Prescription): string => {
    const clinic = prescription.appointments.clinics;
    const doctor = prescription.appointments.doctors;
    
    // Simple HTML to PDF conversion (in production, use a proper PDF library)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription ${prescription.prescription_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .clinic-info { margin-bottom: 20px; }
          .doctor-info { margin-bottom: 20px; }
          .patient-info { margin-bottom: 20px; }
          .prescription-details { margin: 20px 0; }
          .medications { margin: 20px 0; }
          .medication { margin: 10px 0; padding: 10px; border-left: 3px solid #2563EB; background: #f8fafc; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.1); z-index: -1; }
        </style>
      </head>
      <body>
        <div class="watermark">PRESCRIPTION</div>
        
        <div class="header">
          <h1>Medical Prescription</h1>
          <h2>${prescription.prescription_number}</h2>
        </div>
        
        <div class="clinic-info">
          <h3>Clinic Information</h3>
          <p><strong>${clinic.clinic_name}</strong></p>
          ${clinic.address ? `<p>${clinic.address}</p>` : ''}
          ${clinic.phone ? `<p>Phone: ${clinic.phone}</p>` : ''}
        </div>
        
        <div class="doctor-info">
          <h3>Prescribing Doctor</h3>
          <p><strong>Dr. ${doctor.first_name} ${doctor.last_name}</strong></p>
          ${doctor.specialization ? `<p>${doctor.specialization}</p>` : ''}
        </div>
        
        <div class="patient-info">
          <h3>Patient Information</h3>
          <p>Appointment Date: ${new Date(prescription.appointments.appointment_date).toLocaleDateString()}</p>
          <p>Appointment Time: ${prescription.appointments.appointment_time}</p>
        </div>
        
        <div class="prescription-details">
          <h3>Diagnosis</h3>
          <p>${prescription.diagnosis}</p>
        </div>
        
        <div class="medications">
          <h3>Medications</h3>
          ${prescription.medications.map(med => `
            <div class="medication">
              <strong>${med.name} ${med.dosage}</strong><br>
              Frequency: ${med.frequency}<br>
              Duration: ${med.duration}<br>
              ${med.quantity ? `Quantity: ${med.quantity}<br>` : ''}
              ${med.instructions ? `Special Instructions: ${med.instructions}` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="prescription-details">
          <h3>General Instructions</h3>
          <p>${prescription.instructions}</p>
        </div>
        
        ${prescription.follow_up_date ? `
        <div class="prescription-details">
          <h3>Follow-up Appointment</h3>
          <p>${new Date(prescription.follow_up_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Prescription issued on ${new Date(prescription.created_at).toLocaleDateString()}</p>
          <p>This is an official medical prescription. Please follow the instructions carefully.</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  // Open prescription details
  const openPrescriptionDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
    
    // Mark as viewed if not already viewed
    if (!prescription.patient_viewed_at) {
      markAsViewed(prescription.id);
    }
  };

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesSearch = !searchTerm || 
      prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Load data on mount
  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
          <p className="text-sm text-gray-600">View and download your medical prescriptions</p>
        </div>
        <Button
          onClick={loadPrescriptions}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by prescription number, diagnosis, or medication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading prescriptions...</span>
        </div>
      ) : (
        <>
          {/* Prescriptions list */}
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No prescriptions match your filters.' 
                  : 'You don\'t have any prescriptions yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white border rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Prescription #{prescription.prescription_number}
                        </h3>
                        <StatusBadge status={prescription.status} />
                        {prescription.patient_viewed_at && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Viewed
                          </span>
                        )}
                        {prescription.downloaded_at && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Download className="h-3 w-3 mr-1" />
                            Downloaded
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          Dr. {prescription.appointments.doctors.first_name} {prescription.appointments.doctors.last_name}
                        </div>
                        <div className="flex items-center">
                          <Pill className="h-4 w-4 mr-2 text-gray-400" />
                          {prescription.medications.length} medication(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openPrescriptionDetails(prescription)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        onClick={() => downloadPrescription(prescription)}
                        size="sm"
                        disabled={actionLoading}
                        loading={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Diagnosis preview */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{prescription.diagnosis}</p>
                  </div>

                  {/* Medications preview */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Medications:</div>
                    <div className="space-y-1">
                      {prescription.medications.slice(0, 2).map((med, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          <strong>{med.name} {med.dosage}</strong> - {med.frequency} for {med.duration}
                        </div>
                      ))}
                      {prescription.medications.length > 2 && (
                        <div className="text-sm text-gray-500 italic">
                          ...and {prescription.medications.length - 2} more medications
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clinic info */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700 mb-1">Clinic:</div>
                    <div className="text-sm text-gray-600">{prescription.appointments.clinics.clinic_name}</div>
                    {prescription.appointments.clinics.address && (
                      <div className="text-sm text-gray-500">{prescription.appointments.clinics.address}</div>
                    )}
                  </div>

                  {/* Follow-up info */}
                  {prescription.follow_up_date && (
                    <div className="mt-3 flex items-center text-green-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Follow-up: {new Date(prescription.follow_up_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Prescription #{selectedPrescription.prescription_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Issued on {new Date(selectedPrescription.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadPrescription(selectedPrescription)}
                    disabled={actionLoading}
                    loading={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedPrescription(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Prescription Content */}
              <div className="space-y-6">
                {/* Clinic and Doctor Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Clinic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">{selectedPrescription.appointments.clinics.clinic_name}</div>
                      {selectedPrescription.appointments.clinics.address && (
                        <div>{selectedPrescription.appointments.clinics.address}</div>
                      )}
                      {selectedPrescription.appointments.clinics.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPrescription.appointments.clinics.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Prescribing Doctor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-blue-900">
                        Dr. {selectedPrescription.appointments.doctors.first_name} {selectedPrescription.appointments.doctors.last_name}
                      </div>
                      {selectedPrescription.appointments.doctors.specialization && (
                        <div className="text-blue-800">{selectedPrescription.appointments.doctors.specialization}</div>
                      )}
                      <div className="flex items-center text-blue-800">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(selectedPrescription.appointments.appointment_date).toLocaleDateString()} at {selectedPrescription.appointments.appointment_time}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Diagnosis</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800">{selectedPrescription.diagnosis}</p>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Medications</h4>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map((med, index) => (
                      <div key={index} className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <div className="font-semibold text-blue-900 mb-2">
                          {med.name} {med.dosage}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
                          <div>
                            <strong>Frequency:</strong> {med.frequency}
                          </div>
                          <div>
                            <strong>Duration:</strong> {med.duration}
                          </div>
                          {med.quantity && (
                            <div>
                              <strong>Quantity:</strong> {med.quantity}
                            </div>
                          )}
                          {med.instructions && (
                            <div className="sm:col-span-2">
                              <strong>Special Instructions:</strong> {med.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Instructions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">General Instructions</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-800">{selectedPrescription.instructions}</p>
                  </div>
                </div>

                {/* Follow-up */}
                {selectedPrescription.follow_up_date && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Follow-up Appointment</h4>
                    <div className="bg-green-50 p-4 rounded-lg flex items-center">
                      <Calendar className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">
                          {new Date(selectedPrescription.follow_up_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-green-700">Please schedule a follow-up appointment on this date</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-gray-500">
                  <p>This is an official medical prescription. Please follow all instructions carefully.</p>
                  <p className="mt-1">If you have any questions, please contact the clinic or your prescribing doctor.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
