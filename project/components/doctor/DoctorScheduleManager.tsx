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
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorScheduleService, TimeSlot, BlockedDate, ScheduleSettings } from '../../services/doctorScheduleService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const DoctorScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'blocked' | 'settings'>('weekly');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showBlockedDateModal, setShowBlockedDateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Form states
  const [timeSlotForm, setTimeSlotForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    max_appointments: 1
  });

  const [blockedDateForm, setBlockedDateForm] = useState({
    date: '',
    reason: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    consultation_duration: 30,
    buffer_time: 0,
    advance_booking_days: 30,
    auto_confirm: false,
    working_days: [1, 2, 3, 4, 5] // Monday to Friday
  });

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchScheduleData();
    }
  }, [doctorId, activeTab]);

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

  const fetchScheduleData = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      if (activeTab === 'weekly') {
        const { data, error } = await doctorScheduleService.getTimeSlots(doctorId);
        if (error) throw error;
        setTimeSlots(data || []);
      } else if (activeTab === 'blocked') {
        const { data, error } = await doctorScheduleService.getBlockedDates(doctorId);
        if (error) throw error;
        setBlockedDates(data || []);
      } else if (activeTab === 'settings') {
        const { data, error } = await doctorScheduleService.getScheduleSettings(doctorId);
        if (error) throw error;
        setScheduleSettings(data);
        if (data) {
          setSettingsForm({
            consultation_duration: data.consultation_duration,
            buffer_time: data.buffer_time,
            advance_booking_days: data.advance_booking_days,
            auto_confirm: data.auto_confirm,
            working_days: data.working_days
          });
        }
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimeSlot = async () => {
    if (!doctorId) return;

    try {
      const slotData = {
        ...timeSlotForm,
        doctor_id: doctorId
      };

      let result;
      if (editingSlot) {
        result = await doctorScheduleService.updateTimeSlot(editingSlot.id, slotData, doctorId);
      } else {
        result = await doctorScheduleService.createTimeSlot(slotData);
      }

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to save time slot');
        return;
      }

      Alert.alert('Success', 'Time slot saved');
      setShowTimeSlotModal(false);
      setEditingSlot(null);
      fetchScheduleData();
    } catch (error) {
      console.error('Error saving time slot:', error);
      Alert.alert('Error', 'Failed to save time slot');
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    if (!doctorId) return;

    Alert.alert(
      'Delete Time Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await doctorScheduleService.deleteTimeSlot(slotId, doctorId);
              
              if (!success) {
                Alert.alert('Error', error || 'Failed to delete time slot');
                return;
              }

              Alert.alert('Success', 'Time slot deleted');
              fetchScheduleData();
            } catch (error) {
              console.error('Error deleting time slot:', error);
              Alert.alert('Error', 'Failed to delete time slot');
            }
          }
        }
      ]
    );
  };

  const handleAddBlockedDate = async () => {
    if (!doctorId) return;

    try {
      const { success, error } = await doctorScheduleService.addBlockedDate({
        doctor_id: doctorId,
        date: blockedDateForm.date,
        reason: blockedDateForm.reason
      });

      if (!success) {
        Alert.alert('Error', error || 'Failed to add blocked date');
        return;
      }

      Alert.alert('Success', 'Date blocked successfully');
      setShowBlockedDateModal(false);
      setBlockedDateForm({ date: '', reason: '' });
      fetchScheduleData();
    } catch (error) {
      console.error('Error adding blocked date:', error);
      Alert.alert('Error', 'Failed to add blocked date');
    }
  };

  const handleRemoveBlockedDate = async (dateId: string) => {
    if (!doctorId) return;

    Alert.alert(
      'Remove Blocked Date',
      'Are you sure you want to remove this blocked date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await doctorScheduleService.removeBlockedDate(dateId, doctorId);
              
              if (!success) {
                Alert.alert('Error', error || 'Failed to remove blocked date');
                return;
              }

              Alert.alert('Success', 'Blocked date removed');
              fetchScheduleData();
            } catch (error) {
              console.error('Error removing blocked date:', error);
              Alert.alert('Error', 'Failed to remove blocked date');
            }
          }
        }
      ]
    );
  };

  const handleSaveSettings = async () => {
    if (!doctorId) return;

    try {
      const { success, error } = await doctorScheduleService.updateScheduleSettings(settingsForm, doctorId);

      if (!success) {
        Alert.alert('Error', error || 'Failed to save settings');
        return;
      }

      Alert.alert('Success', 'Schedule settings saved');
      setShowSettingsModal(false);
      fetchScheduleData();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const openTimeSlotModal = (slot?: TimeSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setTimeSlotForm({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available,
        max_appointments: slot.max_appointments
      });
    } else {
      setEditingSlot(null);
      setTimeSlotForm({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        max_appointments: 1
      });
    }
    setShowTimeSlotModal(true);
  };

  const toggleWorkingDay = (day: number) => {
    const newWorkingDays = settingsForm.working_days.includes(day)
      ? settingsForm.working_days.filter(d => d !== day)
      : [...settingsForm.working_days, day];
    
    setSettingsForm({ ...settingsForm, working_days: newWorkingDays });
  };

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? '#2563EB' : '#666'} 
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeSlotCard = (slot: TimeSlot) => (
    <View key={slot.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{DAYS_OF_WEEK[slot.day_of_week]}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openTimeSlotModal(slot)}
          >
            <Ionicons name="create" size={16} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTimeSlot(slot.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.timeRange}>
          {slot.start_time} - {slot.end_time}
        </Text>
        <Text style={styles.maxAppointments}>
          Max appointments: {slot.max_appointments}
        </Text>
        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityLabel}>Available:</Text>
          <Switch
            value={slot.is_available}
            onValueChange={(value) => {
              if (doctorId) {
                doctorScheduleService.updateTimeSlot(slot.id, { is_available: value }, doctorId)
                  .then(({ success }) => {
                    if (success) fetchScheduleData();
                  });
              }
            }}
          />
        </View>
      </View>
    </View>
  );

  const renderBlockedDateCard = (blockedDate: BlockedDate) => (
    <View key={blockedDate.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{blockedDate.date}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveBlockedDate(blockedDate.id)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        {blockedDate.reason && (
          <Text style={styles.reasonText}>{blockedDate.reason}</Text>
        )}
      </View>
    </View>
  );

  const renderSettingsCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Schedule Settings</Text>
      <View style={styles.settingsContent}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Consultation Duration (minutes)</Text>
          <Text style={styles.settingValue}>{settingsForm.consultation_duration}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Buffer Time (minutes)</Text>
          <Text style={styles.settingValue}>{settingsForm.buffer_time}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Advance Booking (days)</Text>
          <Text style={styles.settingValue}>{settingsForm.advance_booking_days}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto Confirm</Text>
          <Switch value={settingsForm.auto_confirm} disabled />
        </View>
        <View style={styles.workingDaysContainer}>
          <Text style={styles.settingLabel}>Working Days</Text>
          <View style={styles.workingDaysGrid}>
            {DAYS_OF_WEEK.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  settingsForm.working_days.includes(index) && styles.activeDayButton
                ]}
                onPress={() => toggleWorkingDay(index)}
              >
                <Text style={[
                  styles.dayButtonText,
                  settingsForm.working_days.includes(index) && styles.activeDayButtonText
                ]}>
                  {day.charAt(0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Management</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('weekly', 'Weekly Schedule', 'calendar-outline')}
        {renderTabButton('blocked', 'Blocked Dates', 'close-circle-outline')}
        {renderTabButton('settings', 'Settings', 'settings-outline')}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'weekly' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openTimeSlotModal()}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Time Slot</Text>
            </TouchableOpacity>
            {timeSlots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No time slots configured</Text>
                <Text style={styles.emptySubtitle}>Add time slots to set your weekly schedule</Text>
              </View>
            ) : (
              timeSlots.map(renderTimeSlotCard)
            )}
          </View>
        )}

        {activeTab === 'blocked' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowBlockedDateModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Block Date</Text>
            </TouchableOpacity>
            {blockedDates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No blocked dates</Text>
                <Text style={styles.emptySubtitle}>Block dates when you're unavailable</Text>
              </View>
            ) : (
              blockedDates.map(renderBlockedDateCard)
            )}
          </View>
        )}

        {activeTab === 'settings' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.addButtonText}>Edit Settings</Text>
            </TouchableOpacity>
            {renderSettingsCard()}
          </View>
        )}
      </ScrollView>

      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </Text>
            
            <Text style={styles.inputLabel}>Day of Week</Text>
            <View style={styles.daySelector}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayOption,
                    timeSlotForm.day_of_week === index && styles.selectedDayOption
                  ]}
                  onPress={() => setTimeSlotForm({ ...timeSlotForm, day_of_week: index })}
                >
                  <Text style={[
                    styles.dayOptionText,
                    timeSlotForm.day_of_week === index && styles.selectedDayOptionText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              value={timeSlotForm.start_time}
              onChangeText={(text) => setTimeSlotForm({ ...timeSlotForm, start_time: text })}
            />

            <Text style={styles.inputLabel}>End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="17:00"
              value={timeSlotForm.end_time}
              onChangeText={(text) => setTimeSlotForm({ ...timeSlotForm, end_time: text })}
            />

            <Text style={styles.inputLabel}>Max Appointments</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={timeSlotForm.max_appointments.toString()}
              onChangeText={(text) => setTimeSlotForm({ 
                ...timeSlotForm, 
                max_appointments: parseInt(text) || 1 
              })}
              keyboardType="numeric"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Available</Text>
              <Switch
                value={timeSlotForm.is_available}
                onValueChange={(value) => setTimeSlotForm({ ...timeSlotForm, is_available: value })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTimeSlotModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTimeSlot}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Blocked Date Modal */}
      <Modal
        visible={showBlockedDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockedDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Block Date</Text>
            
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={blockedDateForm.date}
              onChangeText={(text) => setBlockedDateForm({ ...blockedDateForm, date: text })}
            />

            <Text style={styles.inputLabel}>Reason (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Reason for blocking this date..."
              value={blockedDateForm.reason}
              onChangeText={(text) => setBlockedDateForm({ ...blockedDateForm, reason: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBlockedDateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddBlockedDate}
              >
                <Text style={styles.saveButtonText}>Block Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Settings</Text>
            
            <Text style={styles.inputLabel}>Consultation Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={settingsForm.consultation_duration.toString()}
              onChangeText={(text) => setSettingsForm({ 
                ...settingsForm, 
                consultation_duration: parseInt(text) || 30 
              })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Buffer Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={settingsForm.buffer_time.toString()}
              onChangeText={(text) => setSettingsForm({ 
                ...settingsForm, 
                buffer_time: parseInt(text) || 0 
              })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Advance Booking (days)</Text>
            <TextInput
              style={styles.input}
              value={settingsForm.advance_booking_days.toString()}
              onChangeText={(text) => setSettingsForm({ 
                ...settingsForm, 
                advance_booking_days: parseInt(text) || 30 
              })}
              keyboardType="numeric"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Auto Confirm Appointments</Text>
              <Switch
                value={settingsForm.auto_confirm}
                onValueChange={(value) => setSettingsForm({ ...settingsForm, auto_confirm: value })}
              />
            </View>

            <Text style={styles.inputLabel}>Working Days</Text>
            <View style={styles.workingDaysGrid}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    settingsForm.working_days.includes(index) && styles.activeDayButton
                  ]}
                  onPress={() => toggleWorkingDay(index)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    settingsForm.working_days.includes(index) && styles.activeDayButtonText
                  ]}>
                    {day.charAt(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  activeTabButtonText: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  cardContent: {
    gap: 8,
  },
  timeRange: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  maxAppointments: {
    fontSize: 14,
    color: '#6B7280',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  reasonText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  settingsContent: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
  },
  settingValue: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  workingDaysContainer: {
    marginTop: 8,
  },
  workingDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDayButton: {
    backgroundColor: '#2563EB',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeDayButtonText: {
    color: 'white',
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
    textAlign: 'center',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayOption: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDayOption: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedDayOptionText: {
    color: 'white',
  },
});
