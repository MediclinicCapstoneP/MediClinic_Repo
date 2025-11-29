import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorAppointmentService, DoctorAppointment, AppointmentFilters } from '../../services/doctorAppointmentService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

type AppointmentStatus = 'all' | 'scheduled' | 'confirmed' | 'payment_confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface DoctorAppointmentManagementProps {
  onPatientPress?: (patientId: string) => void;
  onAppointmentPress?: (appointment: DoctorAppointment) => void;
}

export const DoctorAppointmentManagement: React.FC<DoctorAppointmentManagementProps> = ({
  onPatientPress,
  onAppointmentPress
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId, selectedStatus, searchTerm, dateFrom, dateTo]);

  const fetchDoctorId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setDoctorId(data.id);
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const filters: AppointmentFilters = {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        patientName: searchTerm || undefined
      };

      const { data, error } = await doctorAppointmentService.getAppointments(doctorId, filters);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    if (!doctorId) return;

    try {
      const { success, error } = await doctorAppointmentService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to update appointment');
        return;
      }

      Alert.alert('Success', `Appointment ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Please provide a reason for cancellation',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => showCancellationReason(appointmentId)
        }
      ]
    );
  };

  const showCancellationReason = (appointmentId: string) => {
    Alert.prompt(
      'Cancellation Reason',
      'Enter reason for cancellation',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (reason) => {
            if (reason && doctorId) {
              doctorAppointmentService.cancelAppointment(appointmentId, reason, doctorId)
                .then(({ success, error }) => {
                  if (success) {
                    Alert.alert('Success', 'Appointment cancelled');
                    fetchAppointments();
                  } else {
                    Alert.alert('Error', error || 'Failed to cancel appointment');
                  }
                });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleRescheduleAppointment = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!selectedAppointment || !doctorId) return;

    try {
      const { success, error } = await doctorAppointmentService.rescheduleAppointment(
        selectedAppointment.id,
        newDate,
        newTime,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to reschedule appointment');
        return;
      }

      Alert.alert('Success', 'Appointment rescheduled');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment');
    }
  };

  const handleAddNotes = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setConsultationNotes(appointment.notes || '');
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    if (!selectedAppointment || !doctorId) return;

    try {
      const { success, error } = await doctorAppointmentService.addConsultationNotes(
        selectedAppointment.id,
        consultationNotes,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to save notes');
        return;
      }

      Alert.alert('Success', 'Consultation notes saved');
      setShowNotesModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'calendar';
      case 'confirmed':
      case 'payment_confirmed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
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

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statusFilterContainer}
    >
      {(['all', 'scheduled', 'confirmed', 'payment_confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.statusFilterButton,
            selectedStatus === status && styles.activeStatusFilter
          ]}
          onPress={() => setSelectedStatus(status)}
        >
          <Ionicons 
            name={getStatusIcon(status)} 
            size={16} 
            color={selectedStatus === status ? 'white' : '#666'} 
          />
          <Text style={[
            styles.statusFilterText,
            selectedStatus === status && styles.activeStatusFilterText
          ]}>
            {status.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAppointmentCard = (appointment: DoctorAppointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(appointment.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
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
          <Text style={styles.dateTimeText}>{formatDate(appointment.appointment_date)}</Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.dateTimeText}>{formatTime(appointment.appointment_time)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.patientInfo}
        onPress={() => onPatientPress?.(appointment.patient.id)}
      >
        <Text style={styles.patientName}>
          {appointment.patient.first_name} {appointment.patient.last_name}
        </Text>
        <Text style={styles.patientContact}>{appointment.patient.phone}</Text>
        <Text style={styles.patientEmail}>{appointment.patient.email}</Text>
      </TouchableOpacity>

      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName}>{appointment.clinic.clinic_name}</Text>
      </View>

      {appointment.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
        </View>
      )}

      {appointment.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      )}

      {appointment.total_amount && (
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount: ₱{appointment.total_amount.toFixed(2)}</Text>
          <Text style={styles.paymentStatus}>{appointment.payment_status || 'Pending'}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'payment_confirmed' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStatusUpdate(appointment.id, 'in_progress')}
            >
              <Ionicons name="play" size={16} color="white" />
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => handleRescheduleAppointment(appointment)}
            >
              <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
              <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(appointment.id)}
            >
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : appointment.status === 'in_progress' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate(appointment.id, 'completed')}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.notesButton]}
              onPress={() => handleAddNotes(appointment)}
            >
              <Ionicons name="create-outline" size={16} color="#8B5CF6" />
              <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Notes</Text>
            </TouchableOpacity>
          </>
        ) : appointment.status === 'completed' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.notesButton]}
            onPress={() => handleAddNotes(appointment)}
          >
            <Ionicons name="create-outline" size={16} color="#8B5CF6" />
            <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Edit Notes</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <View style={styles.dateFilters}>
            <TextInput
              style={styles.dateInput}
              placeholder="From date"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <TextInput
              style={styles.dateInput}
              placeholder="To date"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
        </View>
      )}

      {renderStatusFilter()}

      <ScrollView style={styles.appointmentsList}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        ) : (
          appointments.map(renderAppointmentCard)
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="New Date (YYYY-MM-DD)"
              value={newDate}
              onChangeText={setNewDate}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="New Time (HH:MM)"
              value={newTime}
              onChangeText={setNewTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmReschedule}
              >
                <Text style={styles.confirmModalButtonText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Consultation Notes</Text>
            
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              placeholder="Enter consultation notes..."
              value={consultationNotes}
              onChangeText={setConsultationNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={saveNotes}
              >
                <Text style={styles.confirmModalButtonText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dateFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statusFilterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStatusFilter: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  activeStatusFilterText: {
    color: 'white',
  },
  appointmentsList: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  patientInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
  },
  clinicInfo: {
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#374151',
  },
  notesContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#78350F',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  paymentStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  rescheduleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  notesButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: width - 32,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelModalButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmModalButton: {
    backgroundColor: '#2563EB',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
