import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, Filter, X, Star } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentWithDetails, AppointmentStatus } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { SkeletonBox, SkeletonAppointmentCard } from '@/components/SkeletonLoader';

const STATUS_OPTIONS: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'payment_confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

const STATUS_LABELS: { [key in AppointmentStatus]: string } = {
  'scheduled': 'Scheduled',
  'confirmed': 'Confirmed',
  'payment_confirmed': 'Payment Confirmed',
  'pending_payment': 'Pending Payment',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'no_show': 'No Show',
};

export default function AppointmentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedStatuses]);

  const loadAppointments = async () => {
    if (!user?.profile?.data?.id) return;
    
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments({
        patient_id: user.profile.data.id,
        limit: 50,
      });
      
      if (response.success && response.appointments) {
        setAppointments(response.appointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(apt => selectedStatuses.includes(apt.status));
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredAppointments(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Appointments refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          {loading ? (
            <>
              <SkeletonBox width={150} height={24} style={{ marginBottom: 8 }} />
              <SkeletonBox width={200} height={16} />
            </>
          ) : (
            <>
              <Text style={styles.title}>My Appointments</Text>
              <Text style={styles.subtitle}>
                {user?.role === 'patient' ? 'Manage your upcoming appointments' : 'Today\'s schedule'}
              </Text>
            </>
          )}
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsList}>
          {loading ? (
            [1, 2, 3].map((item) => (
              <SkeletonAppointmentCard key={item} />
            ))
          ) : (
            appointments.map((appointment) => {
            const StatusIcon = getStatusIcon(appointment.status);
            return (
              <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.clinicName}>{appointment.clinicName}</Text>
                    <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(appointment.status)}15` }
                  ]}>
                    <StatusIcon size={14} color={getStatusColor(appointment.status)} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(appointment.status) }
                    ]}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.address}</Text>
                  </View>
                </View>

                <View style={styles.appointmentFooter}>
                  <Text style={styles.appointmentType}>{appointment.type}</Text>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
          )}
        </View>

        {!loading && appointments.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptySubtitle}>
              {user?.role === 'patient' 
                ? 'Book your first appointment to get started'
                : 'Your schedule is clear for today'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  appointmentsList: {
    marginBottom: 20,
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
  appointmentInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  appointmentType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
