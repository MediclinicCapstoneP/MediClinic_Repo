import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  User, Calendar, Clock, Stethoscope, FileText, 
  AlertTriangle, CheckCircle, Plus, X 
} from 'lucide-react';

interface AppointmentCompletionData {
  consultationNotes: string;
  diagnosis: string;
  treatmentPlan: string;
  prescriptionGiven: boolean;
  followUpRequired: boolean;
  followUpDate: string;
  followUpNotes: string;
}

interface EnhancedAppointmentCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: AppointmentCompletionData) => void;
  appointment: {
    id: string;
    patient_name?: string;
    patient?: {
      first_name: string;
      last_name: string;
      email?: string;
    };
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    clinic?: {
      clinic_name: string;
    };
  } | null;
  loading?: boolean;
}

export const EnhancedAppointmentCompletionModal: React.FC<EnhancedAppointmentCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  appointment,
  loading = false
}) => {
  const [formData, setFormData] = useState<AppointmentCompletionData>({
    consultationNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    prescriptionGiven: false,
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof AppointmentCompletionData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.consultationNotes.trim()) {
      newErrors.consultationNotes = 'Consultation notes are required';
    }

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    if (formData.followUpRequired && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required when follow-up is needed';
    }

    if (formData.followUpDate) {
      const followUpDate = new Date(formData.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (followUpDate <= today) {
        newErrors.followUpDate = 'Follow-up date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      consultationNotes: '',
      diagnosis: '',
      treatmentPlan: '',
      prescriptionGiven: false,
      followUpRequired: false,
      followUpDate: '',
      followUpNotes: ''
    });
    setErrors({});
    onClose();
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

  const patientName = appointment?.patient_name || 
    (appointment?.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Unknown Patient');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Appointment"
      size="lg"
    >
      <div className="space-y-6">
        {/* Appointment Summary */}
        {appointment && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{patientName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(appointment.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(appointment.appointment_time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Stethoscope className="h-4 w-4" />
                    <span className="capitalize">{appointment.appointment_type.replace('_', ' ')}</span>
                  </div>
                </div>
                {appointment.clinic && (
                  <p className="text-sm text-gray-500 mt-1">{appointment.clinic.clinic_name}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Consultation Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consultation Notes *
          </label>
          <textarea
            value={formData.consultationNotes}
            onChange={(e) => handleInputChange('consultationNotes', e.target.value)}
            placeholder="Describe the consultation, patient's condition, and any observations..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.consultationNotes ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.consultationNotes && (
            <p className="text-red-600 text-sm mt-1">{errors.consultationNotes}</p>
          )}
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis *
          </label>
          <Input
            value={formData.diagnosis}
            onChange={(e) => handleInputChange('diagnosis', e.target.value)}
            placeholder="Enter primary diagnosis..."
            className={errors.diagnosis ? 'border-red-300' : ''}
          />
          {errors.diagnosis && (
            <p className="text-red-600 text-sm mt-1">{errors.diagnosis}</p>
          )}
        </div>

        {/* Treatment Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Plan
          </label>
          <textarea
            value={formData.treatmentPlan}
            onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
            placeholder="Describe the recommended treatment plan, medications, lifestyle changes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Prescription Given */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="prescriptionGiven"
            checked={formData.prescriptionGiven}
            onChange={(e) => handleInputChange('prescriptionGiven', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="prescriptionGiven" className="text-sm font-medium text-gray-700">
            Prescription given to patient
          </label>
        </div>

        {/* Follow-up Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="followUpRequired"
              checked={formData.followUpRequired}
              onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
              Follow-up appointment required
            </label>
          </div>

          {formData.followUpRequired && (
            <div className="ml-7 space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Follow-up Date *
                </label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                  className={errors.followUpDate ? 'border-red-300' : ''}
                />
                {errors.followUpDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.followUpDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Notes
                </label>
                <textarea
                  value={formData.followUpNotes}
                  onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                  placeholder="Specific instructions for follow-up appointment..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Appointment
              </>
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens when you complete this appointment:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Patient will receive a completion notification</li>
                <li>Appointment will be added to patient's medical history</li>
                <li>Patient will be asked to rate their experience</li>
                {formData.followUpRequired && <li>Follow-up reminder will be scheduled</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
