import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ServicesSelector from './ServicesSelector';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

const AppointmentBookingModal = ({ visible, onClose, clinic, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Services, 3: Confirmation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [servicesOptions, setServicesOptions] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [patientNotes, setPatientNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (visible && clinic) {
      loadClinicServices();
      loadAvailableSlots();
    }
  }, [visible, clinic, selectedDate]);

  const loadClinicServices = () => {
    // Mock services for now - in production, fetch from clinic data
    const mockServices = [
      'General Consultation',
      'Blood Pressure Check',
      'Diabetes Screening',
      'Health Certificate',
      'Vaccination',
      'Medical Examination'
    ];
    setServicesOptions(mockServices);
  };

  const loadAvailableSlots = () => {
    setLoadingSlots(true);
    // Mock time slots - in production, fetch from availability API
    setTimeout(() => {
      const slots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];
      setAvailableTimeSlots(slots);
      setLoadingSlots(false);
    }, 1000);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedTime(''); // Reset time when date changes
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedTime) {
        Alert.alert('Error', 'Please select a time slot');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBookAppointment = async () => {
    if (!user?.profile?.id) {
      Alert.alert('Error', 'Please log in to book an appointment');
      return;
    }

    setLoading(true);
    try {
      // Compose notes with selected services
      const servicesText = selectedServices.length > 0 
        ? `Services needed: ${selectedServices.join(', ')}\n` 
        : '';
      const composedNotes = servicesText + patientNotes;

      const appointmentData = {
        patient_id: user.profile.id,
        clinic_id: clinic.id,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTime + ':00',
        appointment_type: 'consultation',
        notes: composedNotes,
        status: 'scheduled'
      };

      const result = await dataService.createAppointment(appointmentData);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your appointment has been booked successfully.',
          [{ text: 'OK', onPress: () => {
            onSuccess && onSuccess();
            handleClose();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTime('');
    setSelectedServices([]);
    setPatientNotes('');
    onClose();
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNum) => (
        <View key={stepNum} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step >= stepNum && styles.activeStepCircle
          ]}>
            <Text style={[
              styles.stepNumber,
              step >= stepNum && styles.activeStepNumber
            ]}>
              {stepNum}
            </Text>
          </View>
          {stepNum < 3 && (
            <View style={[
              styles.stepLine,
              step > stepNum && styles.activeStepLine
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      
      {/* Date Selection */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={20} color="#1a4fb4" />
        <Text style={styles.dateButtonText}>
          {selectedDate.toDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Time Slots */}
      <Text style={styles.sectionTitle}>Available Time Slots</Text>
      {loadingSlots ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a4fb4" />
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      ) : (
        <View style={styles.timeSlotsContainer}>
          {availableTimeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTime === time && styles.selectedTimeSlotText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Services & Add Notes</Text>
      
      <ServicesSelector
        servicesOptions={servicesOptions}
        selectedServices={selectedServices}
        onServiceToggle={toggleServiceSelection}
        style={styles.servicesSelector}
      />

      <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        value={patientNotes}
        onChangeText={setPatientNotes}
        placeholder="Describe your symptoms or specific concerns..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Your Appointment</Text>
      
      <View style={styles.confirmationCard}>
        <View style={styles.confirmationRow}>
          <Ionicons name="business" size={20} color="#1a4fb4" />
          <Text style={styles.confirmationLabel}>Clinic:</Text>
          <Text style={styles.confirmationValue}>{clinic?.clinic_name}</Text>
        </View>
        
        <View style={styles.confirmationRow}>
          <Ionicons name="calendar" size={20} color="#1a4fb4" />
          <Text style={styles.confirmationLabel}>Date:</Text>
          <Text style={styles.confirmationValue}>{selectedDate.toDateString()}</Text>
        </View>
        
        <View style={styles.confirmationRow}>
          <Ionicons name="time" size={20} color="#1a4fb4" />
          <Text style={styles.confirmationLabel}>Time:</Text>
          <Text style={styles.confirmationValue}>{selectedTime}</Text>
        </View>
        
        {selectedServices.length > 0 && (
          <View style={styles.confirmationRow}>
            <Ionicons name="medical" size={20} color="#1a4fb4" />
            <Text style={styles.confirmationLabel}>Services:</Text>
            <Text style={styles.confirmationValue}>{selectedServices.join(', ')}</Text>
          </View>
        )}
        
        {patientNotes.trim() && (
          <View style={styles.confirmationRow}>
            <Ionicons name="document-text" size={20} color="#1a4fb4" />
            <Text style={styles.confirmationLabel}>Notes:</Text>
            <Text style={styles.confirmationValue}>{patientNotes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={step === 3 ? handleBookAppointment : handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Confirm Booking' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#1a4fb4',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  activeStepNumber: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e9ecef',
    marginHorizontal: 10,
  },
  activeStepLine: {
    backgroundColor: '#1a4fb4',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedTimeSlot: {
    backgroundColor: '#1a4fb4',
    borderColor: '#1a4fb4',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  servicesSelector: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
    fontSize: 16,
    minHeight: 100,
  },
  confirmationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    gap: 15,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    minWidth: 80,
  },
  confirmationValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#1a4fb4',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});

export default AppointmentBookingModal;
