import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { 
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  MapPin,
} from 'lucide-react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { ClinicWithDetails, AppointmentType, PaymentMethod, supabase } from '../../lib/supabase';

interface AppointmentBookingModalProps {
  visible: boolean;
  onClose: () => void;
  clinic: ClinicWithDetails;
  onBookingSuccess?: (appointmentId: string) => void;
}

type BookingStep = 'details' | 'payment' | 'confirmation';

interface BookingData {
  date: string;
  time: string;
  appointmentType: AppointmentType;
  symptoms: string;
  notes: string;
  duration: number;
  consultationFee: number;
  bookingFee: number;
  totalAmount: number;
}

const appointmentTypes: { value: AppointmentType; label: string; duration: number }[] = [
  { value: 'consultation', label: 'General Consultation', duration: 30 },
  { value: 'follow_up', label: 'Follow-up Visit', duration: 20 },
  { value: 'routine_checkup', label: 'Routine Checkup', duration: 45 },
  { value: 'specialist_visit', label: 'Specialist Consultation', duration: 60 },
  { value: 'lab_test', label: 'Laboratory Test', duration: 15 },
  { value: 'imaging', label: 'Medical Imaging', duration: 30 },
  { value: 'vaccination', label: 'Vaccination', duration: 15 },
  { value: 'dental', label: 'Dental Care', duration: 45 },
  { value: 'vision', label: 'Vision Check', duration: 30 },
  { value: 'other', label: 'Other Services', duration: 30 },
];

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'gcash', label: 'GCash', icon: '📱' },
  { value: 'paymaya', label: 'PayMaya', icon: '💳' },
  { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { value: 'grabpay', label: 'GrabPay', icon: '🚗' },
];

export function AppointmentBookingModal({
  visible,
  onClose,
  clinic,
  onBookingSuccess,
}: AppointmentBookingModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Booking data
  const [bookingData, setBookingData] = useState<BookingData>({
    date: new Date().toISOString().split('T')[0],
    time: '',
    appointmentType: 'consultation',
    symptoms: '',
    notes: '',
    duration: 30,
    consultationFee: 500,
    bookingFee: 50,
    totalAmount: 550,
  });

  // Time slots and payment
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('gcash');
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');

  // Load available time slots when date changes
  useEffect(() => {
    if (visible && bookingData.date && clinic.id) {
      loadAvailableTimeSlots();
    }
  }, [visible, bookingData.date, clinic.id]);

  // Update total amount when appointment type changes
  useEffect(() => {
    const selectedType = appointmentTypes.find(type => type.value === bookingData.appointmentType);
    if (selectedType) {
      setBookingData(prev => ({
        ...prev,
        duration: selectedType.duration,
        totalAmount: prev.consultationFee + prev.bookingFee,
      }));
    }
  }, [bookingData.appointmentType, bookingData.consultationFee, bookingData.bookingFee]);

  const loadAvailableTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAvailableTimeSlots(clinic.id, bookingData.date);
      
      if (response.success && response.timeSlots) {
        setAvailableTimeSlots(response.timeSlots);
      } else {
        setError(response.error || 'Failed to load time slots');
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setBookingData(prev => ({ ...prev, date, time: '' }));
    setError(null);
  };

  const handleTimeSelect = (timeSlot: any) => {
    setBookingData(prev => ({
      ...prev,
      time: timeSlot.time,
      consultationFee: timeSlot.consultation_fee,
      totalAmount: timeSlot.consultation_fee + prev.bookingFee,
    }));
  };

  const handleCreateAppointment = async () => {
    // Get patient ID - either from authenticated user or use first available patient for demo
    let patientId = user?.profile?.data?.id;
    
    if (!patientId) {
      // For demo purposes, get the first patient from database
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .limit(1)
        .single();
      
      if (patientsError || !patients) {
        setError('No patients available. Please create a patient account first.');
        return;
      }
      patientId = patients.id;
    }

    if (!patientId) {
      setError('Patient ID is required');
      return;
    }

    if (!bookingData.date || !bookingData.time) {
      setError('Please select date and time for your appointment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const appointmentData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time,
        appointment_type: bookingData.appointmentType,
        duration_minutes: bookingData.duration,
        symptoms: bookingData.symptoms,
        patient_notes: bookingData.notes,
        consultation_fee: bookingData.consultationFee,
        booking_fee: bookingData.bookingFee,
      };

      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.success && response.appointment) {
        setCreatedAppointmentId(response.appointment.id);
        setCurrentStep('payment');
      } else {
        setError(response.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!createdAppointmentId) {
      setError('No appointment to process payment for');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await appointmentService.processPayment({
        appointment_id: createdAppointmentId,
        payment_method: selectedPaymentMethod,
        amount: bookingData.totalAmount,
      });

      if (response.success && response.transactionNumber) {
        setTransactionNumber(response.transactionNumber);
        setCurrentStep('confirmation');
        
        if (onBookingSuccess) {
          onBookingSuccess(createdAppointmentId);
        }
      } else {
        setError(response.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('details');
    setBookingData({
      date: new Date().toISOString().split('T')[0],
      time: '',
      appointmentType: 'consultation',
      symptoms: '',
      notes: '',
      duration: 30,
      consultationFee: 500,
      bookingFee: 50,
      totalAmount: 550,
    });
    setAvailableTimeSlots([]);
    setSelectedPaymentMethod('gcash');
    setCreatedAppointmentId('');
    setTransactionNumber('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContent}>
      {/* Clinic Information */}
      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
        <View style={styles.clinicAddress}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.addressText}>{clinic.address}</Text>
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <View style={styles.datePickerContainer}>
          <Calendar size={20} color="#2563EB" style={styles.inputIcon} />
          <TextInput
            style={styles.dateInput}
            value={bookingData.date}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Time Slots</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading available times...</Text>
          </View>
        ) : availableTimeSlots.length > 0 ? (
          <View style={styles.timeGrid}>
            {availableTimeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotDisabled,
                  bookingData.time === slot.time && styles.timeSlotSelected,
                ]}
                onPress={() => slot.available && handleTimeSelect(slot)}
                disabled={!slot.available}
              >
                <Clock size={16} color={
                  bookingData.time === slot.time ? '#FFFFFF' : 
                  slot.available ? '#2563EB' : '#9CA3AF'
                } />
                <Text style={[
                  styles.timeText,
                  !slot.available && styles.timeTextDisabled,
                  bookingData.time === slot.time && styles.timeTextSelected,
                ]}>
                  {formatTime(slot.time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noSlotsContainer}>
            <Text style={styles.noSlotsText}>No available time slots for this date</Text>
          </View>
        )}
      </View>

      {/* Appointment Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Type</Text>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerValue}>
            {appointmentTypes.find(type => type.value === bookingData.appointmentType)?.label}
          </Text>
          <ChevronDown size={20} color="#6B7280" />
        </View>
        <View style={styles.typeGrid}>
          {appointmentTypes.slice(0, 4).map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                bookingData.appointmentType === type.value && styles.typeCardSelected,
              ]}
              onPress={() => setBookingData(prev => ({ ...prev, appointmentType: type.value }))}
            >
              <Text style={[
                styles.typeLabel,
                bookingData.appointmentType === type.value && styles.typeLabelSelected,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Symptoms/Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms or Reason for Visit</Text>
        <TextInput
          style={styles.textArea}
          value={bookingData.symptoms}
          onChangeText={(text) => setBookingData(prev => ({ ...prev, symptoms: text }))}
          placeholder="Please describe your symptoms or reason for visit..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.textArea}
          value={bookingData.notes}
          onChangeText={(text) => setBookingData(prev => ({ ...prev, notes: text }))}
          placeholder="Any additional information..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Pricing Summary */}
      <View style={styles.pricingSummary}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Consultation Fee</Text>
          <Text style={styles.priceValue}>{formatCurrency(bookingData.consultationFee)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Booking Fee</Text>
          <Text style={styles.priceValue}>{formatCurrency(bookingData.bookingFee)}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatCurrency(bookingData.totalAmount)}</Text>
        </View>
      </View>

      <Button
        title="Continue to Payment"
        onPress={handleCreateAppointment}
        loading={loading}
        disabled={!bookingData.date || !bookingData.time}
        fullWidth
        style={styles.continueButton}
      />
    </ScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentTitle}>Choose Payment Method</Text>
        <Text style={styles.paymentAmount}>{formatCurrency(bookingData.totalAmount)}</Text>
      </View>

      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === method.value && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(method.value)}
          >
            <Text style={styles.paymentIcon}>{method.icon}</Text>
            <Text style={[
              styles.paymentLabel,
              selectedPaymentMethod === method.value && styles.paymentLabelSelected,
            ]}>
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appointmentSummary}>
        <Text style={styles.summaryTitle}>Appointment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date & Time</Text>
          <Text style={styles.summaryValue}>
            {new Date(bookingData.date).toLocaleDateString()} at {formatTime(bookingData.time)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type</Text>
          <Text style={styles.summaryValue}>
            {appointmentTypes.find(type => type.value === bookingData.appointmentType)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{bookingData.duration} minutes</Text>
        </View>
      </View>

      <View style={styles.paymentButtons}>
        <Button
          title="Back"
          onPress={() => setCurrentStep('details')}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Pay Now"
          onPress={handlePayment}
          loading={loading}
          style={styles.payButton}
        />
      </View>
    </ScrollView>
  );

  const renderConfirmationStep = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={48} color="#10B981" />
      </View>
      
      <Text style={styles.confirmationTitle}>Appointment Confirmed!</Text>
      <Text style={styles.confirmationMessage}>
        Your appointment has been successfully booked and payment has been processed.
      </Text>

      <View style={styles.confirmationDetails}>
        <Text style={styles.confirmationLabel}>Transaction Number</Text>
        <Text style={styles.confirmationValue}>{transactionNumber}</Text>
        
        <Text style={styles.confirmationLabel}>Appointment Date</Text>
        <Text style={styles.confirmationValue}>
          {new Date(bookingData.date).toLocaleDateString()} at {formatTime(bookingData.time)}
        </Text>
        
        <Text style={styles.confirmationLabel}>Amount Paid</Text>
        <Text style={styles.confirmationValue}>{formatCurrency(bookingData.totalAmount)}</Text>
      </View>

      <Button
        title="Done"
        onPress={handleClose}
        fullWidth
        style={styles.doneButton}
      />
    </View>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details':
        return 'Book Appointment';
      case 'payment':
        return 'Payment';
      case 'confirmation':
        return 'Confirmation';
      default:
        return 'Book Appointment';
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={getStepTitle()}
      size="lg"
    >
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'payment' && renderPaymentStep()}
      {currentStep === 'confirmation' && renderConfirmationStep()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
  },
  clinicInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  clinicAddress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  timeSlotSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timeSlotDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  timeTextDisabled: {
    color: '#9CA3AF',
  },
  noSlotsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noSlotsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  pickerValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  typeLabel: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  pricingSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  continueButton: {
    marginTop: 20,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  paymentMethods: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  paymentMethodSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#374151',
  },
  paymentLabelSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  appointmentSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationDetails: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  doneButton: {
    marginTop: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
});

export default AppointmentBookingModal;
