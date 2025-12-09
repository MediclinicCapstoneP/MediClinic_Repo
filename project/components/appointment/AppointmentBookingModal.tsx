import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  MapPin,
  X,
} from 'lucide-react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import PaymentWebView from '../payment/PaymentWebView';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { createCheckoutSession } from '../../services/paymongo.service';
import { ClinicWithDetails, AppointmentType, PaymentMethod, supabase } from '../../lib/supabase';

interface AppointmentBookingModalProps {
  visible: boolean;
  onClose: () => void;
  clinic: ClinicWithDetails;
  onBookingSuccess?: (appointmentId: string) => void;
}

type BookingStep = 'details' | 'payment' | 'checkout' | 'confirmation';

interface BookingData {
  date: string;
  time: string;
  appointmentType: AppointmentType;
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutReference, setCheckoutReference] = useState<string | null>(null);

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

  const handleCalendarDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    handleDateChange(dateString);
    setShowCalendar(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const renderCalendar = () => {
    const currentDate = new Date(bookingData.date);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getDaysInMonth(currentDate);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <RNModal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {monthNames[month]} {year}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarDaysHeader}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}
            </View>
            
            <View style={styles.calendarDaysGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.calendarEmptyDay} />;
                }
                
                const isSelected = day === currentDate.getDate();
                const isToday = new Date().getDate() === day && 
                                new Date().getMonth() === month && 
                                new Date().getFullYear() === year;
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isToday && !isSelected && styles.calendarDayToday,
                    ]}
                    onPress={() => handleCalendarDateSelect(new Date(year, month, day))}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isToday && !isSelected && styles.calendarDayTextToday,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </RNModal>
    );
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

  const handleStartPayment = async () => {
    if (!createdAppointmentId) {
      setError('No appointment to process payment for');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const session = await createCheckoutSession(
        bookingData.totalAmount,
        `${clinic.clinic_name} Appointment`,
        {
          paymentMethodTypes: ['gcash'],
          metadata: {
            appointment_id: createdAppointmentId,
            clinic_id: clinic.id,
            appointment_date: bookingData.date,
            appointment_time: bookingData.time,
            patient_id: user?.profile?.data?.id || '',
          },
        }
      );

      const url = session?.attributes?.checkout_url;

      if (!url) {
        throw new Error('Checkout URL was not provided by PayMongo');
      }

      setCheckoutUrl(url);
      setCheckoutReference(session?.attributes?.reference_number || session.id || null);
      setCurrentStep('checkout');
    } catch (error) {
      console.error('Error initializing PayMongo checkout:', error);
      const message = error instanceof Error ? error.message : 'Payment initialization failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    if (!createdAppointmentId) {
      setError('No appointment to finalize payment for');
      setCurrentStep('payment');
      return;
    }

    try {
      setLoading(true);
      const response = await appointmentService.processPayment({
        appointment_id: createdAppointmentId,
        payment_method: selectedPaymentMethod,
        amount: bookingData.totalAmount,
      });

      if (response.success) {
        setTransactionNumber(response.transactionNumber || checkoutReference || '');
        setCurrentStep('confirmation');
        setError(null);

        if (onBookingSuccess) {
          onBookingSuccess(createdAppointmentId);
        }
      } else {
        setError(response.error || 'Failed to record payment');
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('Error finalizing payment:', error);
      setError('An unexpected error occurred while finalizing payment');
      setCurrentStep('payment');
    } finally {
      setLoading(false);
      setCheckoutUrl(null);
      setCheckoutReference(null);
    }
  };

  const handleCheckoutError = (message: string) => {
    console.error('PayMongo checkout error:', message);
    setError(message || 'Payment failed. Please try again.');
    setCheckoutUrl(null);
    setCheckoutReference(null);
    setCurrentStep('payment');
  };

  const handleCheckoutClose = () => {
    setCheckoutUrl(null);
    setCheckoutReference(null);
    setCurrentStep('payment');
  };

  const resetModal = () => {
    setCurrentStep('details');
    setBookingData({
      date: new Date().toISOString().split('T')[0],
      time: '',
      appointmentType: 'consultation',
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
    setCheckoutUrl(null);
    setCheckoutReference(null);
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
        <TouchableOpacity 
          style={styles.datePickerContainer}
          onPress={() => setShowCalendar(true)}
        >
          <Calendar size={20} color="#2563EB" style={styles.inputIcon} />
          <Text style={styles.dateInput}>
            {bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Select Date'}
          </Text>
          <ChevronDown size={20} color="#6B7280" />
        </TouchableOpacity>
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
          title="Pay with GCash"
          onPress={handleStartPayment}
          loading={loading}
          disabled={loading}
          style={styles.payButton}
        />
      </View>
    </ScrollView>
  );

  const renderCheckoutStep = () => (
    <View style={styles.checkoutContainer}>
      <Text style={styles.checkoutTitle}>Pay with GCash</Text>
      <Text style={styles.checkoutSubtitle}>
        Complete your payment securely via PayMongo.
      </Text>

      <View style={styles.checkoutSummary}>
        <Text style={styles.checkoutSummaryLabel}>Amount Due</Text>
        <Text style={styles.checkoutSummaryValue}>{formatCurrency(bookingData.totalAmount)}</Text>
      </View>

      <View style={styles.checkoutWebview}>
        {checkoutUrl ? (
          <PaymentWebView
            url={checkoutUrl}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onClose={handleCheckoutClose}
          />
        ) : (
          <View style={styles.checkoutLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      </View>

      <Button
        title="Cancel Payment"
        onPress={handleCheckoutClose}
        variant="outline"
        style={styles.checkoutCancelButton}
      />
    </View>
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
      {currentStep === 'checkout' && renderCheckoutStep()}
      {currentStep === 'confirmation' && renderConfirmationStep()}
      
      {renderCalendar()}
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
  // Calendar styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 320,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarEmptyDay: {
    width: '14.28%',
    height: 40,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#2563EB',
  },
  calendarDayToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#2563EB',
    fontWeight: '600',
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
