import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase, AppointmentWithDetails, Doctor } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from '../UserProfileDropdown';
import { DoctorAppointmentManagement } from './DoctorAppointmentManagement';
import { DoctorPatientManagement } from './DoctorPatientManagement';
import { DoctorScheduleManager } from './DoctorScheduleManager';
import { DoctorPrescriptionManager } from './DoctorPrescriptionManager';
import { DoctorMedicalRecords } from './DoctorMedicalRecords';
import { DoctorAnalytics } from './DoctorAnalytics';
import { DoctorProfileManager } from './DoctorProfileManager';
import { PatientDetailsModal } from './PatientDetailsModal';

const { width } = Dimensions.get('window');

interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  totalPatients: number;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'appointments' | 'patients' | 'schedule' | 'prescriptions' | 'medical_records' | 'analytics' | 'profile'>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalPatients: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

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

      // Try doctor_appointments first
      const { data: doctorAppointments, error: doctorApptsError } = await supabase
        .from('doctor_appointments')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress', 'assigned'])
        .order('appointment_time', { ascending: true });

      if (!doctorApptsError && doctorAppointments) {
        // Transform doctor_appointments data to match AppointmentWithDetails
        const transformedData = doctorAppointments.map((apt: any) => ({
          ...apt,
          id: apt.appointment_id || apt.id,
          patient: {
            id: apt.patient_id,
            first_name: apt.patient_name?.split(' ')[0] || '',
            last_name: apt.patient_name?.split(' ').slice(1).join(' ') || '',
            email: apt.patient_email || '',
            phone: apt.patient_phone || '',
          },
          clinic: {
            id: apt.clinic_id,
            clinic_name: apt.clinic_name || '',
          },
          symptoms: apt.special_instructions,
          notes: apt.consultation_notes || apt.doctor_notes,
          total_amount: apt.payment_amount ? parseFloat(apt.payment_amount) : undefined,
          payment_status: apt.payment_status,
        }));
        setTodayAppointments(transformedData || []);
        return;
      }

      // Fallback to appointments table
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*)
        `)
        .eq('doctor_id', doctorData.id)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress', 'assigned'])
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching today appointments:', error);
        return;
      }

      setTodayAppointments(data || []);
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

      // Try doctor_appointments first for stats
      const { data: todayApptsDoctor, error: todayErrorDoctor } = await supabase
        .from('doctor_appointments')
        .select('id, status')
        .eq('doctor_id', doctorData.id)
        .eq('appointment_date', today);

      const { data: upcomingApptsDoctor, error: upcomingErrorDoctor } = await supabase
        .from('doctor_appointments')
        .select('id, patient_id')
        .eq('doctor_id', doctorData.id)
        .gt('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'assigned']);

      const { data: totalPatientsDoctor, error: patientsErrorDoctor } = await supabase
        .from('doctor_appointments')
        .select('patient_id')
        .eq('doctor_id', doctorData.id)
        .eq('status', 'completed');

      let todayAppts = todayApptsDoctor;
      let upcomingAppts = upcomingApptsDoctor;
      let totalPatients = totalPatientsDoctor;

      // Fallback to appointments table if doctor_appointments doesn't exist or has errors
      if (todayErrorDoctor || upcomingErrorDoctor || patientsErrorDoctor) {
        const { data: todayApptsFallback } = await supabase
          .from('appointments')
          .select('id, status')
          .eq('doctor_id', doctorData.id)
          .eq('appointment_date', today);

        const { data: upcomingApptsFallback } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', doctorData.id)
          .gt('appointment_date', today)
          .in('status', ['scheduled', 'confirmed', 'payment_confirmed']);

        const { data: totalPatientsFallback } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', doctorData.id)
          .eq('status', 'completed');

        todayAppts = todayApptsFallback;
        upcomingAppts = upcomingApptsFallback;
        totalPatients = totalPatientsFallback;
      }

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
      case 'assigned':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleAppointmentPress = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  const handleModalClose = () => {
    setShowPatientModal(false);
    setSelectedAppointment(null);
  };

  const handleStatusUpdate = () => {
    fetchTodayAppointments();
    fetchStats();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDoctorData(),
        fetchTodayAppointments(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string) => (
    <TouchableOpacity 
      style={[styles.statsCard, { backgroundColor: color + '15', borderLeftWidth: 3, borderLeftColor: color }]}
      activeOpacity={0.7}
    >
      <View style={styles.statsContent}>
        <View style={[styles.statsIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={28} color={color} />
        </View>
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderTodayAppointment = (appointment: AppointmentWithDetails) => (
    <TouchableOpacity 
      key={appointment.id} 
      style={styles.appointmentCard}
      onPress={() => handleAppointmentPress(appointment)}
      activeOpacity={0.7}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.timeText}>
            {formatTime(appointment.appointment_time)}
          </Text>
        </View>
        <View style={styles.headerRight}>
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
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevronIcon} />
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
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.doctorName}>
              {doctor ? `Dr. ${doctor.full_name}` : 'Doctor'}
            </Text>
          </View>
          <UserProfileDropdown />
        </View>
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
            onPress={() => setActiveView('appointments')}
          >
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('patients')}
          >
            <Ionicons name="people-outline" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('schedule')}
          >
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('prescriptions')}
          >
            <Ionicons name="medical-outline" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Prescriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('medical_records')}
          >
            <Ionicons name="folder-outline" size={24} color="#EF4444" />
            <Text style={styles.quickActionText}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('analytics')}
          >
            <Ionicons name="bar-chart-outline" size={24} color="#059669" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setActiveView('profile')}
          >
            <Ionicons name="person-outline" size={24} color="#7C3AED" />
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        visible={showPatientModal}
        onClose={handleModalClose}
        appointment={selectedAppointment}
        onStatusUpdate={handleStatusUpdate}
      />
    </LinearGradient>
  );

  // Render different views based on activeView
  if (activeView === 'appointments') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Appointments</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorAppointmentManagement />
      </View>
    );
  }

  if (activeView === 'patients') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Patients</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorPatientManagement />
      </View>
    );
  }

  if (activeView === 'schedule') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Schedule Management</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorScheduleManager />
      </View>
    );
  }

  if (activeView === 'prescriptions') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Prescriptions</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorPrescriptionManager />
      </View>
    );
  }

  if (activeView === 'medical_records') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Medical Records</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorMedicalRecords />
      </View>
    );
  }

  if (activeView === 'analytics') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Analytics & Reports</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorAnalytics />
      </View>
    );
  }

  if (activeView === 'profile') {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.viewTitle}>Profile Management</Text>
          <View style={{ width: 24 }} />
        </View>
        <DoctorProfileManager />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextGroup: {
    flexShrink: 1,
    paddingRight: 12,
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
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 6,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  statsTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronIcon: {
    marginLeft: 4,
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
