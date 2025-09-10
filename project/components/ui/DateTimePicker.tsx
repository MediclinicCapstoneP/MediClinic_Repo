import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  date?: Date;
  mode?: 'date' | 'time' | 'datetime';
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  style?: any;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  mode = 'datetime',
  onDateChange,
  minimumDate,
  maximumDate,
  placeholder = 'Select date & time',
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [tempDate, setTempDate] = useState<Date>(date || new Date());

  useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setTempDate(date);
    }
  }, [date]);

  const formatDisplay = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return `${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    }
  };

  const generateDates = () => {
    const dates = [];
    const startDate = minimumDate || new Date();
    const endDate = maximumDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        times.push(time);
      }
    }
    return times;
  };

  const dates = generateDates();
  const times = generateTimeSlots();

  const handleDateSelect = (selectedDate: Date) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(selectedDate.getFullYear());
    newDate.setMonth(selectedDate.getMonth());
    newDate.setDate(selectedDate.getDate());
    setTempDate(newDate);
  };

  const handleTimeSelect = (selectedTime: Date) => {
    const newDate = new Date(tempDate);
    newDate.setHours(selectedTime.getHours());
    newDate.setMinutes(selectedTime.getMinutes());
    setTempDate(newDate);
  };

  const handleConfirm = () => {
    setSelectedDate(tempDate);
    onDateChange(tempDate);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempDate(selectedDate);
    setModalVisible(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDateSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>Select Date</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {dates.map((dateOption, index) => {
          const isSelected = dateOption.toDateString() === tempDate.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionItem, isSelected && styles.selectedOption]}
              onPress={() => handleDateSelect(dateOption)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {getDateLabel(dateOption)}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>Select Time</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {times.map((timeOption, index) => {
          const isSelected = timeOption.getHours() === tempDate.getHours() && 
                           timeOption.getMinutes() === tempDate.getMinutes();
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionItem, isSelected && styles.selectedOption]}
              onPress={() => handleTimeSelect(timeOption)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {timeOption.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.input, style]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.inputText, !date && styles.placeholderText]}>
          {date ? formatDisplay(selectedDate) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {mode === 'date' ? 'Select Date' : 
                 mode === 'time' ? 'Select Time' : 
                 'Select Date & Time'}
              </Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.confirmButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectorsContainer}>
              {(mode === 'date' || mode === 'datetime') && renderDateSelector()}
              {(mode === 'time' || mode === 'datetime') && renderTimeSelector()}
            </View>

            <View style={styles.selectedPreview}>
              <Text style={styles.previewLabel}>Selected:</Text>
              <Text style={styles.previewText}>{formatDisplay(tempDate)}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectorsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  selectorSection: {
    flex: 1,
    paddingHorizontal: 8,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedPreview: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
