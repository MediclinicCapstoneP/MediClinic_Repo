import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';

export default function AppointmentHistoryScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user?.profile?.id) return;

    setLoading(true);
    try {
      const result = await dataService.getPatientAppointments(user.profile.id);
      if (result.success && result.data) {
        setAppointments(result.data);
      } else {
        console.error('Failed to load appointments:', result.error);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (filter) {
      case 'upcoming':
        return appointments.filter(
          (apt) =>
            apt.status !== 'cancelled' &&
            apt.appointment_date >= today
        );
      case 'past':
        return appointments.filter(
          (apt) => apt.appointment_date < today
        );
      case 'cancelled':
        return appointments.filter(
          (apt) => apt.status === 'cancelled'
        );
      default:
        return appointments;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'help-circle';
    }
  };

  const handleCancelAppointment = (appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment at ${appointment.clinic?.clinic_name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelAppointment(appointment.id),
        },
      ]
    );
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const result = await dataService.cancelAppointment(appointmentId);
      if (result.success) {
        Alert.alert('Success', 'Appointment cancelled successfully');
        loadAppointments();
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Cancel appointment error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderAppointmentCard = ({ item }) => {
    const canCancel = item.status === 'scheduled' || item.status === 'confirmed';
    const appointmentDate = new Date(item.appointment_date);
    const today = new Date();
    const isUpcoming = appointmentDate >= today && canCancel;

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>
              {item.clinic?.clinic_name || 'Unknown Clinic'}
            </Text>
            <Text style={styles.appointmentType}>
              {item.appointment_type || 'General Consultation'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons
              name={getStatusIcon(item.status)}
              size={16}
              color="#fff"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.detailText}>{formatDate(item.appointment_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.detailText}>{formatTime(item.appointment_time)}</Text>
          </View>
          {item.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>

        {isUpcoming && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => {
                Alert.alert('Coming Soon', 'Reschedule feature will be available soon!');
              }}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFilterTabs = () => {
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'upcoming', label: 'Upcoming' },
      { key: 'past', label: 'Past' },
      { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <View style={styles.filterTabs}>
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem.key}
            style={[
              styles.filterTab,
              filter === filterItem.key && styles.activeFilterTab,
            ]}
            onPress={() => setFilter(filterItem.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterItem.key && styles.activeFilterTabText,
              ]}
            >
              {filterItem.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const filteredAppointments = getFilteredAppointments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a4fb4" />
        <Text style={styles.loadingText}>Loading your appointments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity onPress={() => router.push('/makeappointment')}>
          <Ionicons name="add" size={24} color="#1a4fb4" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No appointments found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {filter === 'all'
              ? "You haven't booked any appointments yet"
              : `No ${filter} appointments`}
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push('/makeappointment')}
          >
            <Text style={styles.bookButtonText}>Book Your First Appointment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating AI Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: '#1a4fb4',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rescheduleButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  rescheduleButtonText: {
    color: '#2196f3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#1a4fb4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a4fb4',
    borderRadius: 35,
    padding: 15,
    elevation: 5,
  },
});
