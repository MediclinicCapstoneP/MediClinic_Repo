import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Building,
  Phone,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { appointmentService } from '../../../../services/appointmentService';
import { AppointmentWithDetails } from '../../../../lib/supabase';

export default function PatientAppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Appointment ID is missing.');
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await appointmentService.getAppointmentWithDetails(id);
        if (!response.success || !response.appointment) {
          setError('Unable to find this appointment.');
          return;
        }
        setAppointment(response.appointment);
      } catch (fetchError) {
        console.error('Error fetching appointment details:', fetchError);
        setError('Something went wrong while loading the appointment.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const statusMeta = useMemo(() => {
    const status = appointment?.status ?? '';
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return { color: '#10B981', label: 'Confirmed', icon: CheckCircle };
      case 'scheduled':
        return { color: '#3B82F6', label: 'Scheduled', icon: Calendar };
      case 'completed':
        return { color: '#6B7280', label: 'Completed', icon: CheckCircle };
      case 'cancelled':
        return { color: '#EF4444', label: 'Cancelled', icon: XCircle };
      default:
        return { color: '#6B7280', label: status || 'Unknown', icon: AlertCircle };
    }
  }, [appointment?.status]);

  const handleContactClinic = () => {
    if (!appointment?.clinic?.phone) {
      Alert.alert('Contact Unavailable', 'This clinic does not have a phone number on file.');
      return;
    }

    Alert.alert(
      'Contact Clinic',
      `Call ${appointment.clinic.clinic_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {} },
      ]
    );
  };

  return (
    <LinearGradient colors={['#eff6ff', '#ecfdf5', '#ecfeff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loaderText}>Loading appointment...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={32} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : appointment ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status */}
            <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.color}15`, borderColor: statusMeta.color }]}> 
              <statusMeta.icon size={18} color={statusMeta.color} />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>

            {/* Schedule Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.row}>
                <Calendar size={18} color="#2563EB" />
                <Text style={styles.rowText}>
                  {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.row}>
                <Clock size={18} color="#2563EB" />
                <Text style={styles.rowText}>{appointment.appointment_time}</Text>
              </View>
              <View style={styles.row}>
                <ClipboardList size={18} color="#2563EB" />
                <Text style={styles.rowText}>Type: {appointment.appointment_type}</Text>
              </View>
            </View>

            {/* Clinic Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clinic</Text>
              <View style={styles.row}>
                <Building size={18} color="#059669" />
                <Text style={styles.rowText}>{appointment.clinic?.clinic_name || 'Clinic information unavailable'}</Text>
              </View>
              {appointment.clinic?.address ? (
                <View style={styles.row}>
                  <MapPin size={18} color="#059669" />
                  <Text style={styles.rowText}>{appointment.clinic.address}</Text>
                </View>
              ) : null}
              {appointment.clinic?.phone ? (
                <TouchableOpacity style={styles.row} onPress={handleContactClinic}>
                  <Phone size={18} color="#059669" />
                  <Text style={[styles.rowText, styles.linkText]}>{appointment.clinic.phone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Doctor Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctor</Text>
              <View style={styles.row}>
                <User size={18} color="#2563EB" />
                <Text style={styles.rowText}>{appointment.doctor?.full_name || 'Doctor not assigned'}</Text>
              </View>
              {appointment.doctor?.specialization ? (
                <Text style={styles.secondaryText}>{appointment.doctor.specialization}</Text>
              ) : null}
            </View>

            {/* Notes */}
            {appointment.doctor_notes || appointment.patient_notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                {appointment.patient_notes ? (
                  <View style={styles.noteCard}>
                    <Text style={styles.noteLabel}>Patient Notes</Text>
                    <Text style={styles.noteText}>{appointment.patient_notes}</Text>
                  </View>
                ) : null}
                {appointment.doctor_notes ? (
                  <View style={styles.noteCard}>
                    <Text style={styles.noteLabel}>Doctor Notes</Text>
                    <Text style={styles.noteText}>{appointment.doctor_notes}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Payment */}
            {appointment.payment ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment</Text>
                <Text style={styles.secondaryText}>Method: {appointment.payment.payment_method ?? 'Not specified'}</Text>
                <Text style={styles.secondaryText}>Amount: ₱{appointment.payment.amount?.toFixed(2) ?? '0.00'}</Text>
                <Text style={styles.secondaryText}>Status: {(appointment.payment as any)?.status ?? appointment.payment.payment_status ?? 'Unknown'}</Text>
              </View>
            ) : null}

            {appointment.cancellation_reason ? (
              <View style={[styles.section, styles.warningSection]}>
                <AlertCircle size={18} color="#F97316" />
                <Text style={[styles.secondaryText, { color: '#F97316', marginLeft: 8 }]}>
                  Cancellation Reason: {appointment.cancellation_reason}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  secondaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  noteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
