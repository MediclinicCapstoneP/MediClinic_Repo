import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Search, Phone, Mail, Calendar, MapPin, Filter } from 'lucide-react-native';
import { SkeletonBox, SkeletonStatCard, SkeletonPatientCard } from '@/components/SkeletonLoader';

const patients = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 912 345 6789',
    lastVisit: '2024-01-10',
    nextAppointment: '2024-01-20',
    status: 'active',
    address: 'Makati City, Metro Manila',
  },
  {
    id: '2',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 923 456 7890',
    lastVisit: '2024-01-08',
    nextAppointment: null,
    status: 'active',
    address: 'Quezon City, Metro Manila',
  },
  {
    id: '3',
    name: 'Anna Reyes',
    email: 'anna.reyes@email.com',
    phone: '+63 934 567 8901',
    lastVisit: '2023-12-15',
    nextAppointment: '2024-01-25',
    status: 'inactive',
    address: 'BGC, Taguig City',
  },
];

export default function PatientsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Patients list refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#059669' : '#6B7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor={'#2563EB'}
            title="Pull to refresh"
            titleColor={'#6B7280'}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {loading ? (
            <>
              <SkeletonBox width={120} height={24} style={{ marginBottom: 8 }} />
              <SkeletonBox width={180} height={16} />
            </>
          ) : (
            <>
              <Text style={styles.title}>My Patients</Text>
              <Text style={styles.subtitle}>Manage your patient records</Text>
            </>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          {loading ? (
            <SkeletonBox width="100%" height={48} borderRadius={12} />
          ) : (
            <>
              <Search size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={20} color="#6B7280" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {loading ? (
            [1, 2, 3].map((item) => (
              <SkeletonStatCard key={item} />
            ))
          ) : (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{patients.length}</Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{patients.filter(p => p.status === 'active').length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{patients.filter(p => p.nextAppointment).length}</Text>
                <Text style={styles.statLabel}>Scheduled</Text>
              </View>
            </>
          )}
        </View>

        {/* Patients List */}
        <View style={styles.patientsList}>
          {loading ? (
            [1, 2, 3, 4].map((item) => (
              <SkeletonPatientCard key={item} />
            ))
          ) : (
            filteredPatients.map((patient) => (
            <TouchableOpacity key={patient.id} style={styles.patientCard}>
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <View style={styles.contactInfo}>
                    <Mail size={14} color="#6B7280" />
                    <Text style={styles.contactText}>{patient.email}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Phone size={14} color="#6B7280" />
                    <Text style={styles.contactText}>{patient.phone}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(patient.status)}15` }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(patient.status) }
                  ]}>
                    {patient.status}
                  </Text>
                </View>
              </View>

              <View style={styles.patientDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.detailText}>{patient.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </Text>
                </View>
                {patient.nextAppointment && (
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#2563EB" />
                    <Text style={[styles.detailText, { color: '#2563EB' }]}>
                      Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.patientActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View Records</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                    Schedule
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
          )}
        </View>

        {!loading && filteredPatients.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Patients will appear here once they book appointments'
              }
            </Text>
          </View>
        )}
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  patientsList: {
    marginBottom: 20,
  },
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  contactText: {
    fontSize: 12,
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
  patientDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  patientActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
