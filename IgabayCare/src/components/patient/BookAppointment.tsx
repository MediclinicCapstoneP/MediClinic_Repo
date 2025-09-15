import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { CreateAppointmentData, AppointmentType } from '../../types/appointments';
import { supabase } from '../../supabaseClient';
import { PaymentForm } from './PaymentForm';
import { PaymentResponse } from '../../types/payment';

interface BookAppointmentProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

export const BookAppointment: React.FC<BookAppointmentProps> = ({
  isOpen,
  onClose,
  clinicId,
  clinicName,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [notes, setNotes] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [step, setStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);

  // Appointment types for selection
  const appointmentTypes: AppointmentType[] = [
    'consultation',
    'follow_up',
    'routine_checkup',
    'specialist_visit',
    'lab_test',
    'imaging',
    'vaccination',
    'physical_therapy',
    'dental',
    'vision',
    'other'
  ];

  // Format appointment type for display
  const formatAppointmentType = (type: AppointmentType): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get current user and patient ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Get patient ID from patients table
        const { data: patientData, error } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (patientData) {
          setPatientId(patientData.id);
        } else if (error) {
          console.error('Error fetching patient data:', error);
          setError('Unable to retrieve your patient information. Please try again later.');
        }
      }
    };

    getUser();
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!clinicId || !selectedDate) return;
      
      setLoading(true);
      try {
        const slots = await AppointmentService.getAvailableTimeSlots(
          clinicId,
          selectedDate
        );
        setAvailableTimeSlots(slots);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Unable to fetch available time slots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [clinicId, selectedDate]);

  // Format time for display
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Handle booking appointment
  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !patientId || !clinicId) {
      setError('Please select a date and time for your appointment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appointmentData: CreateAppointmentData = {
        patient_id: patientId,
        clinic_id: clinicId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        patient_notes: notes,
        duration_minutes: 30, // Default duration
      };

      const result = await AppointmentService.createAppointment(appointmentData);
      
      if (result) {
        setCreatedAppointment(result);
        setStep('payment');
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('An error occurred while booking your appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = (response: PaymentResponse) => {
    setPaymentResponse(response);
    setStep('confirmation');
  };

  // Reset form when modal closes
  const handleClose = () => {
    setSelectedTime('');
    setAppointmentType('consultation');
    setNotes('');
    setError(null);
    setSuccess(false);
    setStep('form');
    setCreatedAppointment(null);
    setPaymentResponse(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'form' ? "Book an Appointment" : step === 'payment' ? "Payment" : "Appointment Confirmed"}
      size="lg"
    >
      <div className="space-y-6">
        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked!</h3>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully scheduled. You will receive a confirmation email shortly.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {step === 'form' && (
              <>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Clinic Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{clinicName}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Select Date</h4>
                  <div className="flex items-center space-x-4">
                    <Calendar size={20} className="text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Select Time</h4>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading available time slots...</p>
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableTimeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedTime === time
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {formatTime(time)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No available time slots for this date. Please select another date.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Appointment Type</h4>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {appointmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatAppointmentType(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Reason for Visit</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please describe your symptoms or reason for visit..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBookAppointment} 
                    loading={loading}
                    disabled={!selectedDate || !selectedTime || loading}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </>
            )}

            {step === 'payment' && createdAppointment && (
              <PaymentForm
                clinicId={clinicId}
                patientId={patientId}
                appointmentData={{
                  appointment_id: createdAppointment.id,
                  consultation_fee: 500.00, // Default consultation fee
                  booking_fee: 100.00, // Default booking fee
                  total_amount: 600.00 // Total amount
                }}
                onPaymentComplete={handlePaymentComplete}
                onBack={() => setStep('form')}
              />
            )}

            {step === 'confirmation' && paymentResponse && (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-4">
                  Your appointment has been confirmed and payment has been processed.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Transaction Number:</span>
                      <span className="font-mono">{paymentResponse.transaction_number}</span>
                    </div>
                    {paymentResponse.instructions && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-xs text-blue-800">{paymentResponse.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleClose}>Close</Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};