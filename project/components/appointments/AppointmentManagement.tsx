import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Appointment, AppointmentWithDetails } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type AppointmentFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

interface AppointmentManagementProps {
  userRole: 'patient' | 'doctor' | 'clinic';
}

export const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ userRole }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<AppointmentFilter>('all');

  // Reschedule state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [user, filter]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          doctor:doctors(*),
          payment:payments(*)
        `);

      // Apply role-based filtering
      if (userRole === 'patient') {
        const { data: patientData } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (patientData) {
          query = query.eq('patient_id', patientData.id);
        }
      } else if (userRole === 'doctor') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (doctorData) {
          query = query.eq('doctor_id', doctorData.id);
        }
      } else if (userRole === 'clinic') {
        const { data: clinicData } = await supabase
          .from('clinics')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (clinicData) {
          query = query.eq('clinic_id', clinicData.id);
        }
      }

      // Apply status filtering
      if (filter === 'upcoming') {
        query = query.in('status', ['scheduled', 'confirmed', 'payment_confirmed']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (filter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }

      query = query.order('appointment_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        Alert.alert('Error', 'Failed to load appointments');
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => cancelAppointment(appointmentId)
        }
      ]
    );
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id
        })
        .eq('id', appointmentId);

      if (error) {
        Alert.alert('Error', 'Failed to cancel appointment');
        return;
      }

      Alert.alert('Success', 'Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel appointment');
    }
  };

  const openRescheduleModal = (appointmentId: string) => {
    setRescheduleAppointmentId(appointmentId);
    setNewDate('');
    setNewTime('');
    setRescheduleModalVisible(true);
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleAppointmentId) return;
    if (!newDate || !newTime) {
      Alert.alert('Select new slot', 'Please enter a valid date (YYYY-MM-DD) and time (HH:MM)');
      return;
    }
    try {
      setRescheduling(true);
      const { success, error } = await appointmentService.rescheduleAppointment(
        rescheduleAppointmentId,
        newDate,
        newTime
      );
      if (!success) {
        Alert.alert('Reschedule failed', error || 'Unknown error');
        return;
      }
      setRescheduleModalVisible(false);
      fetchAppointments();
      Alert.alert('Rescheduled', 'Your appointment has been moved');
    } catch (e) {
      Alert.alert('Reschedule failed', 'An unexpected error occurred');
    } finally {
      setRescheduling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderFilterButtons = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {(['all', 'upcoming', 'completed', 'cancelled'] as AppointmentFilter[]).map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterButton,
            filter === filterOption && styles.activeFilterButton
          ]}
          onPress={() => setFilter(filterOption)}
        >
          <Text style={[
            styles.filterButtonText,
            filter === filterOption && styles.activeFilterButtonText
          ]}>
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAppointmentCard = (appointment: AppointmentWithDetails) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(appointment.status) }
            ]} 
          />
          <Text style={styles.statusText}>
            {appointment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.appointmentType}>
          {appointment.appointment_type.replace('_', ' ')}
        </Text>
      </View>

      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeItem}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.dateTimeText}>
            {formatDate(appointment.appointment_date)}
          </Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.dateTimeText}>
            {formatTime(appointment.appointment_time)}
          </Text>
        </View>
      </View>

      {/* Show different info based on user role */}
      {userRole === 'patient' && appointment.clinic && (
        <View style={styles.entityInfo}>
          <Text style={styles.entityName}>{appointment.clinic.clinic_name}</Text>
          {appointment.doctor && (
            <Text style={styles.entitySubtext}>Dr. {appointment.doctor.full_name}</Text>
          )}
        </View>
      )}

      {userRole === 'doctor' && appointment.patient && (
        <View style={styles.entityInfo}>
          <Text style={styles.entityName}>
            {appointment.patient.first_name} {appointment.patient.last_name}
          </Text>
          <Text style={styles.entitySubtext}>{appointment.patient.phone}</Text>
        </View>
      )}

      {userRole === 'clinic' && (
        <View style={styles.entityInfo}>
          {appointment.patient && (
            <Text style={styles.entityName}>
              {appointment.patient.first_name} {appointment.patient.last_name}
            </Text>
          )}
          {appointment.doctor && (
            <Text style={styles.entitySubtext}>Dr. {appointment.doctor.full_name}</Text>
          )}
        </View>
      )}

      {appointment.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
        </View>
      )}

      {appointment.total_amount && (
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.amountText}>₱{appointment.total_amount.toFixed(2)}</Text>
        </View>
      )}

      {/* Action buttons */}
      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => openRescheduleModal(appointment.id)}
          >
            <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
            <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>
              Reschedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelAppointment(appointment.id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterButtons()}

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalLabel}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2025-01-15"
              value={newDate}
              onChangeText={setNewDate}
            />
            <Text style={styles.modalLabel}>New Time (HH:MM - 24h)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="14:30"
              value={newTime}
              onChangeText={setNewTime}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setRescheduleModalVisible(false)}
                disabled={rescheduling}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleRescheduleAppointment}
                disabled={rescheduling}
              >
                <Text style={styles.modalConfirmText}>
                  {rescheduling ? 'Rescheduling...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <ScrollView
        style={styles.appointmentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'You have no appointments yet' 
                : `No ${filter} appointments`}
            </Text>
          </View>
        ) : (
          appointments.map(renderAppointmentCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  appointmentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
  entityInfo: {
    marginBottom: 8,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entitySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  symptomsText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalConfirm: {
    backgroundColor: '#2563EB',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rescheduleButton: {
    borderColor: '#3B82F6',
  },
  cancelButton: {
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
