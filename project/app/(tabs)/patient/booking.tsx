import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react-native';

const appointmentTypes = [
  { id: '1', name: 'General Consultation', price: 500, duration: '30 min' },
  { id: '2', name: 'Routine Checkup', price: 450, duration: '45 min' },
  { id: '3', name: 'Follow-up Visit', price: 300, duration: '20 min' },
  { id: '4', name: 'Specialist Consultation', price: 800, duration: '60 min' },
  { id: '5', name: 'Vaccination', price: 200, duration: '15 min' },
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

export default function BookingScreen() {
  const [selectedType, setSelectedType] = useState('1');
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');

  const selectedAppointment = appointmentTypes.find(type => type.id === selectedType);
  const bookingFee = 50;
  const total = selectedAppointment ? selectedAppointment.price + bookingFee : bookingFee;

  const handleBookAppointment = () => {
    // Here you would integrate with PayMongo GCash
    console.log('Processing payment...');
    // After successful payment, navigate to confirmation
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Clinic Info */}
        <View style={styles.clinicCard}>
          <Text style={styles.clinicName}>HealthCare Plus Clinic</Text>
          <View style={styles.clinicDetails}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.clinicAddress}>Makati City, Metro Manila</Text>
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Appointment Type</Text>
          {appointmentTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                selectedType === type.id && styles.selectedTypeCard,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <View style={styles.typeInfo}>
                <Text style={[
                  styles.typeName,
                  selectedType === type.id && styles.selectedTypeText,
                ]}>
                  {type.name}
                </Text>
                <Text style={styles.typeDuration}>{type.duration}</Text>
              </View>
              <Text style={[
                styles.typePrice,
                selectedType === type.id && styles.selectedTypeText,
              ]}>
                ₱{type.price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#2563EB" />
            <Text style={styles.selectedDate}>January 15, 2024</Text>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Clock size={16} color={selectedTime === time ? '#FFFFFF' : '#6B7280'} />
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consultation Fee</Text>
              <Text style={styles.summaryValue}>₱{selectedAppointment?.price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Booking Fee</Text>
              <Text style={styles.summaryValue}>₱{bookingFee}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱{total}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookingFooter}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
          <CreditCard size={20} color="#FFFFFF" />
          <Text style={styles.bookButtonText}>Pay with GCash - ₱{total}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  clinicDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTypeCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedTypeText: {
    color: '#2563EB',
  },
  typeDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  typePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDate: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTimeSlot: {
    backgroundColor: '#2563EB',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
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
  totalLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  bookingFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});