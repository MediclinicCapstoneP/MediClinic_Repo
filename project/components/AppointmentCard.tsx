import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock, User, MapPin } from 'lucide-react-native';

interface AppointmentCardProps {
  appointment: {
    id: string;
    patientName?: string;
    doctorName?: string;
    clinicName?: string;
    date: string;
    time: string;
    type: string;
    status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    location?: string;
  };
  onPress?: () => void;
  showPatient?: boolean;
}

export default function AppointmentCard({
  appointment,
  onPress,
  showPatient = false,
}: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'in-progress': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateTime}>
          <Calendar size={16} color="#2563EB" />
          <Text style={styles.dateText}>{appointment.date}</Text>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.timeText}>{appointment.time}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(appointment.status)}15` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(appointment.status) }
          ]}>
            {appointment.status}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {showPatient && appointment.patientName && (
          <View style={styles.row}>
            <User size={16} color="#6B7280" />
            <Text style={styles.name}>{appointment.patientName}</Text>
          </View>
        )}
        
        {!showPatient && appointment.doctorName && (
          <View style={styles.row}>
            <User size={16} color="#6B7280" />
            <Text style={styles.name}>Dr. {appointment.doctorName}</Text>
          </View>
        )}

        {appointment.clinicName && (
          <View style={styles.row}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.clinicName}>{appointment.clinicName}</Text>
          </View>
        )}

        {appointment.location && (
          <View style={styles.row}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.location}>{appointment.location}</Text>
          </View>
        )}

        <Text style={styles.type}>{appointment.type}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clinicName: {
    fontSize: 14,
    color: '#6B7280',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  type: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});