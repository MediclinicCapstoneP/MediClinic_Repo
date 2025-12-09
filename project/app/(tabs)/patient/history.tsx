import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentService } from '../../../services/appointmentService';
import { AppointmentWithDetails } from '../../../lib/supabase';
import { SkeletonAppointmentCard } from '../../../components/SkeletonLoader';

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function PatientHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments(selectedFilter);
  }, [appointments, selectedFilter]);

  const loadAppointments = async () => {
    if (!user?.profile?.data?.id) return;
    
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments({
        patient_id: user.profile.data.id,
        limit: 50,
      });
      if (response.success && response.appointments) {
        setAppointments(response.appointments.sort((a, b) => 
          new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = (status: FilterStatus) => {
    let filtered = appointments;
    
    if (status !== 'all') {
      filtered = appointments.filter(apt => {
        switch (status) {
          case 'upcoming':
            return apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'payment_confirmed';
          case 'completed':
            return apt.status === 'completed';
          case 'cancelled':
            return apt.status === 'cancelled';
          default:
            return true;
        }
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAppointments();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return CheckCircle;
      case 'scheduled':
        return Calendar;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <LinearGradient
      colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
              tintColor={'#2563EB'}
              title="Pull to refresh"
              titleColor={'#6B7280'}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Appointment History</Text>
              <Text style={styles.subtitle}>View your past and upcoming appointments</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.key && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.key && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Appointments List */}
          <View style={styles.appointmentsContainer}>
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <SkeletonAppointmentCard key={item} />
                ))}
              </>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status);
                return (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentCard}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/patient/history/[id]',
                        params: { id: appointment.id },
                      });
                    }}
                  >
                    <View style={styles.appointmentHeader}>
                      <View style={styles.clinicInfo}>
                        <Text style={styles.clinicName}>{appointment.clinic?.clinic_name}</Text>
                        <View style={styles.locationInfo}>
                          <MapPin size={14} color="#6B7280" />
                          <Text style={styles.locationText}>
                            {appointment.clinic?.city}, {appointment.clinic?.state}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                        <StatusIcon size={16} color="#FFFFFF" />
                        <Text style={styles.statusText}>{appointment.status}</Text>
                      </View>
                    </View>

                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                          {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{appointment.appointment_time}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={styles.detailText}>{appointment.appointment_type}</Text>
                      </View>
                    </View>

                    {appointment.clinic && (
                      <View style={styles.ratingSection}>
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {(appointment.clinic as any)?.average_rating ? (appointment.clinic as any).average_rating.toFixed(1) : '0.0'}
                          {(appointment.clinic as any)?.total_reviews && ` (${(appointment.clinic as any).total_reviews} reviews)`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No appointments found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedFilter === 'all' 
                    ? "You haven't made any appointments yet" 
                    : `No ${selectedFilter} appointments found`}
                </Text>
                {selectedFilter === 'all' && (
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push('/(tabs)/patient/clinics')}
                  >
                    <Text style={styles.bookButtonText}>Book Your First Appointment</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  appointmentsContainer: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 40,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
