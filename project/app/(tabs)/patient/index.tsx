import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  Heart,
  Activity,
  Calendar,
  Stethoscope,
  Eye,
  Baby,
  LogOut,
  Navigation,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import ClinicCard from '../../../components/ClinicCard';
import { SkeletonBox, SkeletonClinicCard, SkeletonStatCard } from '../../../components/SkeletonLoader';
import UserProfileDropdown from '../../../components/UserProfileDropdown';
import { clinicService } from '../../../services/clinicService';
import { appointmentService } from '../../../services/appointmentService';
import { ClinicWithDetails, AppointmentWithDetails } from '../../../lib/supabase';
import { AppointmentBookingModal } from '../../../components/appointment/AppointmentBookingModal';
import { ClinicLocationMap } from '../../../components/maps/ClinicLocationMap';

const quickActions = [
  { id: '1', title: 'Book Appointment', icon: Calendar, color: '#2563EB' },
  { id: '2', title: 'Find Clinics', icon: MapPin, color: '#059669' },
  { id: '3', title: 'My History', icon: Clock, color: '#DC2626' },
  { id: '4', title: 'Prescriptions', icon: Heart, color: '#7C2D12' },
];

const specialties = [
  { id: '1', name: 'General Medicine', icon: Stethoscope, count: 24 },
  { id: '2', name: 'Pediatrics', icon: Baby, count: 12 },
  { id: '3', name: 'Ophthalmology', icon: Eye, count: 8 },
  { id: '4', name: 'Cardiology', icon: Heart, count: 15 },
];

export default function PatientHomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyClinics, setNearbyClinics] = useState<ClinicWithDetails[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDetails | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalClinics: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadNearbyClinics(),
        loadRecentAppointments(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyClinics = async () => {
    try {
      // Mock location for demo - in real app, get user's location
      const response = await clinicService.getNearbyClinic(14.5995, 120.9842, 10);
      if (response.success && response.clinics) {
        setNearbyClinics(response.clinics.slice(0, 5).map(c => c.clinic));
      }
    } catch (error) {
      console.error('Error loading nearby clinics:', error);
    }
  };

  const loadRecentAppointments = async () => {
    if (!user?.profile?.data?.id) return;
    
    try {
      const response = await appointmentService.getAppointments({
        patient_id: user.profile.data.id,
        limit: 3,
      });
      if (response.success && response.appointments) {
        setRecentAppointments(response.appointments);
      }
    } catch (error) {
      console.error('Error loading recent appointments:', error);
    }
  };


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await clinicService.searchClinics(searchQuery);
      if (response.success && response.clinics) {
        // Navigate to search results - we'll implement this later
        console.log('Search results:', response.clinics);
      }
    } catch (error) {
      console.error('Error searching clinics:', error);
    }
  };

  const handleClinicPress = (clinic: ClinicWithDetails) => {
    setSelectedClinic(clinic);
    setShowBookingModal(true);
  };

  const handleShowLocation = (clinic: ClinicWithDetails) => {
    setSelectedClinic(clinic);
    setShowLocationMap(true);
  };

  const handleBookingSuccess = (appointmentId: string) => {
    console.log('Appointment booked:', appointmentId);
    setShowBookingModal(false);
    setSelectedClinic(null);
    loadRecentAppointments(); // Refresh appointments
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <LinearGradient
      colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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
                <SkeletonBox width={120} height={20} style={{ marginBottom: 8 }} />
                <SkeletonBox width={180} height={16} />
              </View>
              <SkeletonBox width={40} height={40} borderRadius={20} />
            </>
          ) : (
            <>
              <View>
                <Text style={styles.greeting}>Good Morning!</Text>
                <Text style={styles.userName}>
                  Welcome back, {(user?.profile as any)?.data?.first_name || 'Patient'}
                </Text>
              </View>
              <UserProfileDropdown />
            </>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clinics, doctors, or services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/(tabs)/patient/clinics')}>
            <Filter size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          {loading ? (
            <>
              <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
              <View style={styles.quickActionsGrid}>
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={styles.quickActionCard}>
                    <SkeletonBox width={48} height={48} borderRadius={24} style={{ marginBottom: 8 }} />
                    <SkeletonBox width={80} height={14} />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionCard}
                    onPress={() => {
                      if (action.title === 'Book Appointment') {
                        router.push('/(tabs)/patient/booking' as any);
                      }
                      // Remove Find Clinics navigation for now
                    }}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                      <action.icon size={24} color={action.color} />
                    </View>
                    <Text style={styles.quickActionText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          {loading ? (
            <>
              <SkeletonBox width={150} height={20} style={{ marginBottom: 16 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={styles.specialtyCard}>
                    <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
                    <SkeletonBox width={80} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={12} />
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Popular Specialties</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
                {specialties.map((specialty) => (
                  <TouchableOpacity key={specialty.id} style={styles.specialtyCard}>
                    <View style={styles.specialtyIcon}>
                      <specialty.icon size={20} color="#2563EB" />
                    </View>
                    <Text style={styles.specialtyName}>{specialty.name}</Text>
                    <Text style={styles.specialtyCount}>{specialty.count} clinics</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Nearby Clinics */}
        <View style={styles.section}>
          {loading ? (
            <>
              <View style={styles.sectionHeader}>
                <SkeletonBox width={120} height={20} />
                <SkeletonBox width={60} height={16} />
              </View>
              {[1, 2, 3].map((item) => (
                <SkeletonClinicCard key={item} />
              ))}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Clinics</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {nearbyClinics.map((clinic) => (
                <View key={clinic.id} style={styles.clinicCard}>
                  <TouchableOpacity 
                    style={styles.clinicInfo}
                    onPress={() => handleClinicPress(clinic)}
                  >
                    <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
                    <View style={styles.clinicDetails}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.clinicAddress}>{clinic.city}, {clinic.state}</Text>
                    </View>
                    <View style={styles.clinicMeta}>
                      <View style={styles.rating}>
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{(clinic.average_rating || 0).toFixed(1)}</Text>
                      </View>
                      <Text style={styles.distance}>{clinic.specialties?.[0] || 'General'}</Text>
                      <Text style={styles.price}>Book Now</Text>
                    </View>
                    {clinic.specialties && clinic.specialties.length > 0 && (
                      <View style={styles.specialtiesContainer}>
                        {clinic.specialties.slice(0, 2).map((specialty, index) => (
                          <View key={index} style={styles.specialtyTag}>
                            <Text style={styles.specialtyTagText}>{specialty}</Text>
                          </View>
                        ))}
                        {clinic.specialties.length > 2 && (
                          <Text style={styles.moreSpecialties}>+{clinic.specialties.length - 2} more</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={() => handleShowLocation(clinic)}
                  >
                    <Navigation size={16} color="#2563EB" />
                    <Text style={styles.locationButtonText}>Show Location</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Recent Appointments */}
        {recentAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentAppointments.map((appointment) => (
              <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentClinic}>{appointment.clinic?.clinic_name}</Text>
                  <Text style={styles.appointmentDate}>
                    {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                    {appointment.appointment_time}
                  </Text>
                  <View style={styles.appointmentMeta}>
                    <Text style={styles.appointmentType}>{appointment.appointment_type}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Text style={styles.statusText}>{appointment.status}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </ScrollView>

        {/* Appointment Booking Modal */}
      {selectedClinic && (
        <AppointmentBookingModal
          visible={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedClinic(null);
          }}
          clinic={selectedClinic}
          onBookingSuccess={handleBookingSuccess}
        />  
      )}

      {/* Location Map Modal */}
      {selectedClinic && (
        <Modal
          visible={showLocationMap}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setShowLocationMap(false);
            setSelectedClinic(null);
          }}
        >
          <ClinicLocationMap
            clinic={{
              id: selectedClinic.id,
              name: selectedClinic.clinic_name,
              address: selectedClinic.address,
              latitude: selectedClinic.latitude,
              longitude: selectedClinic.longitude,
              city: selectedClinic.city,
              province: selectedClinic.state,
            }}
            onClose={() => {
              setShowLocationMap(false);
              setSelectedClinic(null);
            }}
          />
        </Modal>
      )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  notificationBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
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
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  specialtiesScroll: {
    paddingLeft: 4,
  },
  specialtyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  specialtyCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  clinicCard: {
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
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  clinicDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  clinicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
  },
  price: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyTagText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentCard: {
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
  appointmentInfo: {
    flex: 1,
  },
  appointmentClinic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentType: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 6,
  },
});
