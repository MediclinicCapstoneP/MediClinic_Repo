import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, AppointmentWithDetails, Doctor } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  totalPatients: number;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalPatients: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorData();
      fetchTodayAppointments();
      fetchStats();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching doctor data:', error);
        return;
      }

      setDoctor(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!user) return;

    try {
      // Get doctor ID first
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctorData) return;

      const today = new Date().toISOString().split('T')[0];

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress'])
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching today appointments:', error);
        return;
      }

      // Manually fetch related data
      const enrichedAppointments = await Promise.all(
        (appointmentData || []).map(async (appointment) => {
          try {
            const enriched: any = { ...appointment };
            
            // Fetch patient data
            if (appointment.patient_id) {
              const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', appointment.patient_id)
                .single();
              enriched.patient = patient;
            }
            
            // Fetch clinic data
            if (appointment.clinic_id) {
              const { data: clinic } = await supabase
                .from('clinics')
                .select('*')
                .eq('id', appointment.clinic_id)
                .single();
              enriched.clinic = clinic;
            }
            
            return enriched;
          } catch (err) {
            console.warn('Error enriching appointment:', err);
            return appointment;
          }
        })
      );

      setTodayAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get doctor ID first
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctorData) return;

      const today = new Date().toISOString().split('T')[0];

      // Today's appointments
      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('doctor_id', doctorData.id)
        .eq('appointment_date', today);

      // Upcoming appointments (future dates)
      const { data: upcomingAppts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorData.id)
        .gt('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed']);

      // Total unique patients
      const { data: totalPatients } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorData.id)
        .eq('status', 'completed');

      const uniquePatients = new Set(totalPatients?.map(apt => apt.patient_id));

      const todayCount = todayAppts?.length || 0;
      const completedTodayCount = todayAppts?.filter(apt => apt.status === 'completed').length || 0;
      const upcomingCount = upcomingAppts?.length || 0;

      setStats({
        todayAppointments: todayCount,
        upcomingAppointments: upcomingCount,
        completedToday: completedTodayCount,
        totalPatients: uniquePatients.size
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        Alert.alert('Error', 'Failed to start consultation');
        return;
      }

      Alert.alert('Success', 'Consultation started');
      fetchTodayAppointments();
      fetchStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to start consultation');
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        Alert.alert('Error', 'Failed to complete consultation');
        return;
      }

      Alert.alert('Success', 'Consultation completed');
      fetchTodayAppointments();
      fetchStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete consultation');
    }
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

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statsCard, { backgroundColor: color + '15' }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderTodayAppointment = (appointment: AppointmentWithDetails) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.timeText}>
            {formatTime(appointment.appointment_time)}
          </Text>
        </View>
        <View 
          style={[
            styles.statusBadge,
            { backgroundColor: getAppointmentStatusColor(appointment.status) }
          ]}
        >
          <Text style={styles.statusText}>
            {appointment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {appointment.patient && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {appointment.patient.first_name} {appointment.patient.last_name}
          </Text>
          <Text style={styles.appointmentType}>
            {appointment.appointment_type.replace('_', ' ')}
          </Text>
        </View>
      )}

      {appointment.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText} numberOfLines={2}>
            {appointment.symptoms}
          </Text>
        </View>
      )}

      <View style={styles.appointmentActions}>
        {appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'payment_confirmed' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleStartConsultation(appointment.id)}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.actionButtonText}>Start Consultation</Text>
          </TouchableOpacity>
        ) : appointment.status === 'in_progress' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCompleteConsultation(appointment.id)}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.doctorName}>
          {doctor ? `Dr. ${doctor.full_name}` : 'Doctor'}
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatsCard('Today\'s Appointments', stats.todayAppointments, 'calendar', '#3B82F6')}
          {renderStatsCard('Completed Today', stats.completedToday, 'checkmark-circle', '#10B981')}
        </View>
        <View style={styles.statsRow}>
          {renderStatsCard('Upcoming', stats.upcomingAppointments, 'time', '#F59E0B')}
          {renderStatsCard('Total Patients', stats.totalPatients, 'people', '#8B5CF6')}
        </View>
      </View>

      {/* Today's Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text style={styles.appointmentCount}>
            {todayAppointments.length} appointments
          </Text>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No appointments today</Text>
            <Text style={styles.emptySubtitle}>Enjoy your day off!</Text>
          </View>
        ) : (
          todayAppointments.map(renderTodayAppointment)
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/doctor/appointments' as any)}
          >
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>View All Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="people-outline" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Patient Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="bar-chart-outline" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="settings-outline" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  patientInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  symptomsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
