import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Users, Activity, Clock, TrendingUp, Bell, CheckCircle, FileText, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonBox, SkeletonStatCard, SkeletonCard } from '@/components/SkeletonLoader';

const stats = [
  { id: '1', title: 'Today\'s Appointments', value: '12', icon: Calendar, color: '#2563EB' },
  { id: '2', title: 'Total Patients', value: '248', icon: Users, color: '#059669' },
  { id: '3', title: 'Prescriptions', value: '89', icon: Activity, color: '#DC2626' },
  { id: '4', title: 'Completed Today', value: '8', icon: CheckCircle, color: '#7C2D12' },
];

const appointments = [
  {
    id: '1',
    patientName: 'Maria Santos',
    time: '09:00 AM',
    type: 'General Consultation',
    status: 'confirmed',
  },
  {
    id: '2',
    patientName: 'Juan Dela Cruz',
    time: '10:30 AM',
    type: 'Follow-up',
    status: 'in-progress',
  },
  {
    id: '3',
    patientName: 'Anna Reyes',
    time: '02:00 PM',
    type: 'Routine Checkup',
    status: 'confirmed',
  },
];

export default function DoctorDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'in-progress': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate API calls to refresh doctor dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You can add actual data refresh logic here:
      // - Refresh today's appointments
      // - Update patient statistics
      // - Refresh recent activity
      // - Update prescription counts
      
      console.log('Doctor dashboard data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']} // Android
            tintColor={'#2563EB'} // iOS
            title="Pull to refresh" // iOS
            titleColor={'#6B7280'} // iOS
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {loading ? (
            <>
              <View>
                <SkeletonBox width={200} height={20} style={{ marginBottom: 8 }} />
                <SkeletonBox width={160} height={16} />
              </View>
              <SkeletonBox width={48} height={48} borderRadius={24} />
            </>
          ) : (
            <>
              <View>
                <Text style={styles.greeting}>Good Morning, Dr. Smith!</Text>
                <Text style={styles.dateText}>Monday, January 15, 2024</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>DS</Text>
              </View>
            </>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {loading ? (
            stats.map((stat) => (
              <SkeletonStatCard key={stat.id} />
            ))
          ) : (
            stats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          {loading ? (
            <>
              <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
              <View style={styles.actionsContainer}>
                <SkeletonBox width="48%" height={48} borderRadius={8} />
                <SkeletonBox width="48%" height={48} borderRadius={8} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/(tabs)/doctor/appointments' as any)}
                >
                  <Calendar size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>View Appointments</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => router.push('/(tabs)/doctor/prescriptions' as any)}
                >
                  <FileText size={20} color="#2563EB" />
                  <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                    Create Prescription
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          {loading ? (
            <>
              <View style={styles.sectionHeader}>
                <SkeletonBox width={140} height={20} />
                <SkeletonBox width={60} height={16} />
              </View>
              {[1, 2, 3].map((item) => (
                <SkeletonCard key={item} />
              ))}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {appointments.map((appointment) => (
                <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentTime}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.timeText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.patientName}>{appointment.patientName}</Text>
                    <Text style={styles.appointmentType}>{appointment.type}</Text>
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
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          {loading ? (
            <>
              <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
              <View style={styles.activityCard}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.activityItem}>
                    <SkeletonBox width={16} height={16} borderRadius={8} />
                    <SkeletonBox width="70%" height={14} style={{ flex: 1, marginHorizontal: 8 }} />
                    <SkeletonBox width={60} height={12} />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <CheckCircle size={16} color="#059669" />
                  <Text style={styles.activityText}>
                    Completed consultation with Maria Santos
                  </Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
                <View style={styles.activityItem}>
                  <FileText size={16} color="#2563EB" />
                  <Text style={styles.activityText}>
                    Created prescription for Juan Dela Cruz
                  </Text>
                  <Text style={styles.activityTime}>4 hours ago</Text>
                </View>
                <View style={styles.activityItem}>
                  <AlertCircle size={16} color="#F59E0B" />
                  <Text style={styles.activityText}>
                    New appointment request from Anna Reyes
                  </Text>
                  <Text style={styles.activityTime}>6 hours ago</Text>
                </View>
              </View>
            </>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563EB',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    minWidth: 60,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentType: {
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
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});