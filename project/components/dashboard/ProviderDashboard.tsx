import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, AppointmentWithDetails, Doctor, Clinic, Review, ClinicWithDetails } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewsAnalytics } from './ReviewsAnalytics';
import { RecentReviews } from './RecentReviews';

const { width } = Dimensions.get('window');

interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  totalPatients: number;
  totalReviews: number;
  averageRating: number;
  monthlyRevenue: number;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  qualityMetrics: {
    serviceQuality: number;
    facilityCleanliness: number;
    staffFriendliness: number;
    waitTimeSatisfaction: number;
    overallExperience: number;
  };
  recentReviews: Review[];
}

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [provider, setProvider] = useState<Doctor | Clinic | null>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'clinic'>('doctor');
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalPatients: 0,
    totalReviews: 0,
    averageRating: 0,
    monthlyRevenue: 0,
  });
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
    qualityMetrics: {
      serviceQuality: 0,
      facilityCleanliness: 0,
      staffFriendliness: 0,
      waitTimeSatisfaction: 0,
      overallExperience: 0,
    },
    recentReviews: [],
  });
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      detectUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (provider && userRole) {
      fetchTodayAppointments();
      fetchStats();
      fetchReviewStats();
    }
  }, [provider, userRole]);

  const detectUserRole = async () => {
    if (!user) return;

    try {
      // First try to find as doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (doctorData && !doctorError) {
        setProvider(doctorData);
        setUserRole('doctor');
        return;
      }

      // Then try to find as clinic
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (clinicData && !clinicError) {
        setProvider(clinicData);
        setUserRole('clinic');
        return;
      }

      console.error('User not found as doctor or clinic');
    } catch (error) {
      console.error('Error detecting user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!provider) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          doctor:doctors(*)
        `)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress'])
        .order('appointment_time', { ascending: true });

      if (userRole === 'doctor') {
        query = query.eq('doctor_id', provider.id);
      } else {
        query = query.eq('clinic_id', provider.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching today appointments:', error);
        return;
      }

      setTodayAppointments(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStats = async () => {
    if (!provider) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      let appointmentQuery = supabase.from('appointments').select('*');
      
      if (userRole === 'doctor') {
        appointmentQuery = appointmentQuery.eq('doctor_id', provider.id);
      } else {
        appointmentQuery = appointmentQuery.eq('clinic_id', provider.id);
      }

      // Today's appointments
      const { data: todayAppts } = await appointmentQuery
        .eq('appointment_date', today);

      // Upcoming appointments
      const { data: upcomingAppts } = await appointmentQuery
        .gt('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed']);

      // Total unique patients
      const { data: totalPatients } = await appointmentQuery
        .eq('status', 'completed');

      // Monthly revenue
      const { data: monthlyAppts } = await appointmentQuery
        .like('appointment_date', `${thisMonth}%`)
        .eq('status', 'completed');

      const uniquePatients = new Set(totalPatients?.map(apt => apt.patient_id));
      const monthlyRevenue = monthlyAppts?.reduce((sum, apt) => sum + (apt.total_amount || 0), 0) || 0;

      const todayCount = todayAppts?.length || 0;
      const completedTodayCount = todayAppts?.filter(apt => apt.status === 'completed').length || 0;
      const upcomingCount = upcomingAppts?.length || 0;

      setStats(prevStats => ({
        ...prevStats,
        todayAppointments: todayCount,
        upcomingAppointments: upcomingCount,
        completedToday: completedTodayCount,
        totalPatients: uniquePatients.size,
        monthlyRevenue,
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviewStats = async () => {
    if (!provider) return;

    try {
      let reviewQuery = supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(first_name, last_name),
          appointment:appointments(appointment_date, appointment_type)
        `);

      if (userRole === 'doctor') {
        reviewQuery = reviewQuery.eq('doctor_id', provider.id);
      } else {
        reviewQuery = reviewQuery.eq('clinic_id', provider.id);
      }

      const { data: reviews, error } = await reviewQuery
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      if (!reviews || reviews.length === 0) {
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: [],
          qualityMetrics: {
            serviceQuality: 0,
            facilityCleanliness: 0,
            staffFriendliness: 0,
            waitTimeSatisfaction: 0,
            overallExperience: 0,
          },
          recentReviews: [],
        });
        return;
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

      // Rating distribution
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
      });
      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
      }));

      // Quality metrics averages
      const qualityMetrics = {
        serviceQuality: reviews.reduce((sum, r) => sum + (r.service_quality || 0), 0) / totalReviews,
        facilityCleanliness: reviews.reduce((sum, r) => sum + (r.facility_cleanliness || 0), 0) / totalReviews,
        staffFriendliness: reviews.reduce((sum, r) => sum + (r.staff_friendliness || 0), 0) / totalReviews,
        waitTimeSatisfaction: reviews.reduce((sum, r) => sum + (r.wait_time_satisfaction || 0), 0) / totalReviews,
        overallExperience: reviews.reduce((sum, r) => sum + (r.overall_experience || 0), 0) / totalReviews,
      };

      setReviewStats({
        totalReviews,
        averageRating,
        ratingDistribution,
        qualityMetrics,
        recentReviews: reviews.slice(0, 5), // Get 5 most recent
      });

      // Update stats with review data
      setStats(prevStats => ({
        ...prevStats,
        totalReviews,
        averageRating,
      }));

    } catch (error) {
      console.error('Error fetching review stats:', error);
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
      fetchReviewStats(); // Refresh reviews as completed appointments may generate reviews
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
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

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.statsCard, { backgroundColor: color + '15' }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
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
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorText}>
          Please complete your {userRole} profile setup to access the dashboard.
        </Text>
      </View>
    );
  }

  const providerName = userRole === 'doctor' 
    ? `Dr. ${(provider as Doctor).full_name}`
    : (provider as Clinic).clinic_name;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.providerName}>{providerName}</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Main Stats Cards */}
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

      {/* Reviews and Rating Section */}
      <View style={styles.reviewsSection}>
        <View style={styles.statsRow}>
          {renderStatsCard(
            'Average Rating', 
            stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0', 
            'star', 
            '#FFA500',
            `${stats.totalReviews} reviews`
          )}
          {renderStatsCard(
            'Monthly Revenue', 
            formatCurrency(stats.monthlyRevenue), 
            'cash', 
            '#059669'
          )}
        </View>
      </View>

      {/* Reviews Analytics */}
      <ReviewsAnalytics reviewStats={reviewStats} />

      {/* Recent Reviews */}
      <RecentReviews reviews={reviewStats.recentReviews} />

      {/* Today's Schedule */}
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
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>View All Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="people-outline" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Patient Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="star-outline" size={24} color="#FFA500" />
            <Text style={styles.quickActionText}>All Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="bar-chart-outline" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Analytics</Text>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: 'white',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  providerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  reviewsSection: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#1F2937',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  patientInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#4B5563',
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
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
});
