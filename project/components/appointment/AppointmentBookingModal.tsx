import { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
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
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appointmentService } from '../../services/appointmentService';
import { createCheckoutSession } from '../../services/paymongo.service';
import { ClinicWithDetails, AppointmentType, PaymentMethod, supabase, Patient } from '../../lib/supabase';

interface AppointmentBookingModalProps {
  visible: boolean;
  onClose: () => void;
  clinic: ClinicWithDetails;
  onBookingSuccess?: (appointmentId: string) => void;
}

type BookingStep = 'details' | 'payment' | 'verifying' | 'confirmation';

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

interface StoredBookingPayload {
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  patient_notes?: string;
  consultation_fee: number;
  booking_fee: number;
  total_amount: number;
}

const PENDING_BOOKING_KEY = 'pending_booking_data';
const CHECKOUT_SESSION_KEY = 'checkout_session_id';

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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingMessage, setVerifyingMessage] = useState<string | null>(null);
  
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
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutReference, setCheckoutReference] = useState<string | null>(null);

  // Load available time slots when date changes
  useEffect(() => {
    if (visible && bookingData.date && clinic.id) {
      loadAvailableTimeSlots();
    }
  }, [visible, bookingData.date, clinic.id]);

  useEffect(() => {
    if (!visible) return;
    preloadStoredBooking();
  }, [visible]);

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
    setCheckoutSessionId(null);
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
    setCheckoutSessionId(null);
  };

  const ensurePatientId = useCallback(async (): Promise<string | null> => {
    let patientId: string | undefined;

    if (user?.profile?.role === 'patient') {
      patientId = (user.profile.data as Patient).id;
    }

    if (!patientId) {
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .limit(1)
        .single();

      if (patientsError || !patients) {
        return null;
      }

      patientId = patients.id;
    }

    return patientId;
  }, [user?.profile?.role, user?.profile?.data]);

  const computeBookingPayload = useCallback(async (): Promise<StoredBookingPayload | null> => {
    const patientId = await ensurePatientId();
    if (!patientId) {
      setError('No patient profile found. Please create a patient account first.');
      return null;
    }

    if (!bookingData.date || !bookingData.time) {
      setError('Please select date and time for your appointment');
      return null;
    }

    const payload: StoredBookingPayload = {
      patient_id: patientId,
      clinic_id: clinic.id,
      appointment_date: bookingData.date,
      appointment_time: bookingData.time,
      appointment_type: bookingData.appointmentType,
      patient_notes: bookingData.notes,
      consultation_fee: bookingData.consultationFee,
      booking_fee: bookingData.bookingFee,
      total_amount: bookingData.totalAmount,
    };

    return payload;
  }, [bookingData, clinic.id, ensurePatientId]);

  const storeBookingData = useCallback(async (payload: StoredBookingPayload, sessionId: string) => {
    await AsyncStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(payload));
    await AsyncStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
  }, []);

  const preloadStoredBooking = useCallback(async () => {
    try {
      const storedBooking = await AsyncStorage.getItem(PENDING_BOOKING_KEY);
      const storedSession = await AsyncStorage.getItem(CHECKOUT_SESSION_KEY);

      if (storedBooking) {
        const parsed = JSON.parse(storedBooking) as StoredBookingPayload;
        setBookingData(prev => ({
          ...prev,
          date: parsed.appointment_date,
          time: parsed.appointment_time,
          appointmentType: parsed.appointment_type,
          notes: parsed.patient_notes || '',
          consultationFee: parsed.consultation_fee,
          bookingFee: parsed.booking_fee,
          totalAmount: parsed.total_amount,
        }));
      }

      if (storedSession) {
        setCheckoutSessionId(storedSession);
      }
    } catch (storageError) {
      console.error('Error preloading booking data:', storageError);
    }
  }, []);

  const clearStoredBooking = useCallback(async () => {
    await AsyncStorage.removeItem(PENDING_BOOKING_KEY);
    await AsyncStorage.removeItem(CHECKOUT_SESSION_KEY);
  }, []);

  const buildCheckoutDescription = useCallback(() => {
    return `${clinic.clinic_name} Appointment`;
  }, [clinic.clinic_name]);

  const buildCheckoutMetadata = useCallback(
    (payload: StoredBookingPayload, patientName?: string | null, patientEmail?: string | null) => ({
      clinic_id: payload.clinic_id,
      clinic_name: clinic.clinic_name,
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      appointment_type: payload.appointment_type,
      patient_notes: payload.patient_notes || '',
      consultation_fee: String(payload.consultation_fee),
      booking_fee: String(payload.booking_fee),
      patient_id: payload.patient_id,
      source: 'mediclinic_app_mobile',
      patient_name: patientName || '',
      patient_email: patientEmail || '',
      timestamp: new Date().toISOString(),
    }),
    [clinic.clinic_name]
  );

  const buildCustomerInfo = useCallback(() => {
    if (user?.profile?.role === 'patient') {
      const patientProfile = user.profile.data as Patient;
      const fullName = `${patientProfile.first_name ?? ''} ${patientProfile.last_name ?? ''}`.trim();

      return {
        name: fullName || user.email || 'Patient',
        email: patientProfile.email || user.email || 'patient@example.com',
        phone: patientProfile.phone || '',
        address: {
          line1: patientProfile.address || clinic.address || 'N/A',
          line2: '',
          city: clinic.city || 'N/A',
          state: clinic.state || 'N/A',
          postal_code: clinic.zip_code || '0000',
          country: 'PH',
        },
      };
    }

    return {
      name: user?.email?.split('@')[0] || 'Patient',
      email: user?.email || 'patient@example.com',
      phone: '',
      address: {
        line1: clinic.address || 'N/A',
        line2: '',
        city: clinic.city || 'N/A',
        state: clinic.state || 'N/A',
        postal_code: clinic.zip_code || '0000',
        country: 'PH',
      },
    };
  }, [clinic.address, clinic.city, clinic.state, clinic.zip_code, user]);

  const handleContinueToPayment = useCallback(async () => {
    const payload = await computeBookingPayload();
    if (!payload) {
      return;
    }

    setCurrentStep('payment');
  }, [computeBookingPayload]);

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
    setTransactionNumber('');
    setCheckoutSessionId(null);
    setCheckoutReference(null);
    setError(null);
    setLoading(false);
    setVerifyingMessage(null);
  };

  const handlePrepareCheckout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = await computeBookingPayload();
      if (!payload) {
        setLoading(false);
        return;
      }

      const customerInfo = buildCustomerInfo();
      const metadata = buildCheckoutMetadata(payload, customerInfo.name, customerInfo.email);
      const description = buildCheckoutDescription();

      const session = await createCheckoutSession(payload.total_amount, description, {
        paymentMethodTypes: ['gcash'],
        customerInfo,
        metadata,
      });

      const checkoutUrl = session?.attributes?.checkout_url;
      const sessionId = session?.id;

      if (!checkoutUrl || !sessionId) {
        throw new Error('Checkout session missing URL or identifier');
      }

      setCheckoutSessionId(sessionId);
      setCheckoutReference(session?.attributes?.reference_number || sessionId);

      await storeBookingData(payload, sessionId);

      // Navigate to the checkout page
      router.push({
        pathname: '/appointment-checkout',
        params: {
          checkoutUrl,
          sessionId,
        },
      });

      // Close the modal
      resetModal();
      onClose();
    } catch (checkoutError) {
      console.error('Error preparing PayMongo checkout:', checkoutError);
      const message = checkoutError instanceof Error ? checkoutError.message : 'Payment initialization failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    buildCheckoutDescription,
    buildCheckoutMetadata,
    buildCustomerInfo,
    computeBookingPayload,
    storeBookingData,
    router,
    onClose,
  ]);

  const handleStartPayment = async () => {
    await handlePrepareCheckout();
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
        onPress={handleContinueToPayment}
        loading={loading}
        disabled={!bookingData.date || !bookingData.time || loading}
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
          title={checkoutSessionId ? 'Resume Payment' : 'Pay with GCash'}
          onPress={handleStartPayment}
          loading={loading}
          disabled={loading}
          style={styles.payButton}
        />
      </View>
    </ScrollView>
  );

  const renderVerifyingStep = () => (
    <View style={styles.verifyingContainer}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.verifyingTitle}>Finishing up…</Text>
      <Text style={styles.verifyingSubtitle}>
        {verifyingMessage || 'We are confirming your payment and booking your appointment.'}
      </Text>
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
      {currentStep === 'verifying' && renderVerifyingStep()}
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
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  verifyingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  verifyingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AppointmentBookingModal;
