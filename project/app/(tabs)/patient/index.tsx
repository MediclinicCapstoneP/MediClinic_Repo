import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Heart,
  Calendar,
  Navigation,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import ClinicCard from '../../../components/ClinicCard';
import { SkeletonBox, SkeletonClinicCard } from '../../../components/SkeletonLoader';
import UserProfileDropdown from '../../../components/UserProfileDropdown';
import { clinicService } from '../../../services/clinicService';
import { appointmentService } from '../../../services/appointmentService';
import { ClinicWithDetails, AppointmentWithDetails } from '../../../lib/supabase';
import { AppointmentBookingModal } from '../../../components/appointment/AppointmentBookingModal';
import { ClinicLocationMap } from '../../../components/maps/ClinicLocationMap';

const quickActions = [
  {
    id: 'history',
    title: 'Medical History',
    icon: Clock,
    color: '#0891B2',
    route: '/(tabs)/patient/history',
    description: 'Timeline & records',
  },
  {
    id: 'prescriptions',
    title: 'Prescriptions',
    icon: Heart,
    color: '#DC2626',
    route: '/(tabs)/patient/prescriptions',
    description: 'Active medications',
  },
];



type Coordinates = {
  latitude: number;
  longitude: number;
};

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
  const [locationCoords, setLocationCoords] = useState<Coordinates | null>(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [nearbyClinicsMessage, setNearbyClinicsMessage] = useState<string | null>(null);

  const requestUserLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      setLocationFetching(true);
      setLocationError(null);
      setLocationPermissionDenied(false);

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setLocationError(
          canAskAgain
            ? 'Location permission is required to show clinics near you.'
            : 'Location access is disabled in your settings. Enable it to see clinics nearby.'
        );
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocationCoords(coords);
      return coords;
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Unable to determine your location. Please try again.');
      return null;
    } finally {
      setLocationFetching(false);
    }
  }, []);

  const ensureUserLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (locationCoords) {
      return locationCoords;
    }

    return await requestUserLocation();
  }, [locationCoords, requestUserLocation]);

  const loadNearbyClinics = useCallback(async (coords?: Coordinates | null) => {
    const targetCoords = coords ?? locationCoords;

    if (!targetCoords) {
      setNearbyClinics([]);
      setNearbyClinicsMessage(null);
      return;
    }

    try {
      setLocationError(null);
      const response = await clinicService.getNearbyClinic(targetCoords.latitude, targetCoords.longitude, 10);
      if (response.success && response.clinics && response.clinics.length > 0) {
        const clinics = response.clinics.slice(0, 5).map((c) => c.clinic);
        setNearbyClinics(clinics);
        setNearbyClinicsMessage(null);
        setStats((prev) => ({
          ...prev,
          totalClinics: clinics.length,
        }));
      } else {
        setNearbyClinics([]);
        setNearbyClinicsMessage('No clinics found near your current location yet.');
        setStats((prev) => ({
          ...prev,
          totalClinics: 0,
        }));
      }
    } catch (error) {
      console.error('Error loading nearby clinics:', error);
      setNearbyClinics([]);
      setNearbyClinicsMessage(null);
      setLocationError('Unable to load clinics near you. Please try again.');
      setStats((prev) => ({
        ...prev,
        totalClinics: 0,
      }));
    }
  }, [locationCoords]);

  const loadRecentAppointments = useCallback(async () => {
    if (!user?.profile?.data?.id) return;

    try {
      const response = await appointmentService.getAppointments({
        patient_id: user.profile.data.id,
        limit: 3,
      });
      if (response.success && response.appointments) {
        setRecentAppointments(response.appointments);
        const upcomingCount = response.appointments.filter((apt) =>
          ['scheduled', 'confirmed', 'payment_confirmed', 'pending_payment', 'in_progress'].includes(apt.status),
        ).length;
        const completedCount = response.appointments.filter((apt) => apt.status === 'completed').length;
        setStats((prev) => ({
          ...prev,
          upcomingAppointments: upcomingCount,
          completedAppointments: completedCount,
        }));
      }
    } catch (error) {
      console.error('Error loading recent appointments:', error);
      setStats((prev) => ({
        ...prev,
        upcomingAppointments: 0,
        completedAppointments: 0,
      }));
    }
  }, [user?.profile?.data?.id]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const coords = await ensureUserLocation();
      await Promise.all([
        loadNearbyClinics(coords),
        loadRecentAppointments(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [ensureUserLocation, loadNearbyClinics, loadRecentAppointments]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRequestLocation = useCallback(async () => {
    const coords = await requestUserLocation();
    if (coords) {
      await loadNearbyClinics(coords);
    }
  }, [loadNearbyClinics, requestUserLocation]);


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
          <View>
            {loading ? (
              <>
                <SkeletonBox width={120} height={18} style={{ marginBottom: 6 }} />
                <SkeletonBox width={200} height={24} />
              </>
            ) : (
              <>
                <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},</Text>
                <Text style={styles.userName}>
                  {(user?.profile as any)?.data?.first_name || 'Patient'}
                </Text>
              </>
            )}
          </View>
          <UserProfileDropdown />
        </View>

        {/* Hero */}
        <LinearGradient
          colors={['#2563EB', '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroEyebrow}>Your care hub</Text>
              <Text style={styles.heroHeadline}>Stay on top of your health journey</Text>
              <Text style={styles.heroSubtitle}>
                Book visits, review your records, and manage prescriptions all in one place.
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => router.push('/(tabs)/patient/clinics')}
              >
                <Text style={styles.heroCtaText}>Find a clinic nearby</Text>
                <Navigation size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroIllustration}>
              <Calendar size={42} color="#0F172A" />
            </View>
          </View>
          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{stats.upcomingAppointments}</Text>
              <Text style={styles.heroStatLabel}>Upcoming Visits</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{stats.completedAppointments}</Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{stats.totalClinics}</Text>
              <Text style={styles.heroStatLabel}>Clinics Nearby</Text>
            </View>
          </View>
        </LinearGradient>

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
              <SkeletonBox width={140} height={20} style={{ marginBottom: 16 }} />
              <View style={styles.quickActionsGrid}>
                {Array.from({ length: Math.max(quickActions.length, 2) }).map((_, index) => (
                  <View key={`quick-action-skeleton-${index}`} style={[styles.quickActionCard, styles.quickActionSkeleton]}>
                    <SkeletonBox width={48} height={48} borderRadius={24} style={{ marginBottom: 10 }} />
                    <SkeletonBox width={100} height={14} />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Tools</Text>
                <Text style={styles.sectionSubtitle}>Manage your health in a tap</Text>
              </View>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionCard}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}12` }]}>
                      <action.icon size={24} color={action.color} />
                    </View>
                    <Text style={styles.quickActionText}>{action.title}</Text>
                    <Text style={styles.quickActionDescription}>{action.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        
        {/* Nearby Clinics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Clinics</Text>
            <TouchableOpacity
              onPress={handleRequestLocation}
              disabled={locationFetching}
            >
              <Text
                style={[
                  styles.viewAllText,
                  locationFetching && styles.viewAllTextDisabled,
                ]}
              >
                {locationFetching ? 'Locating…' : 'Use My Location'}
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <>
              {[1, 2, 3].map((item) => (
                <SkeletonClinicCard key={item} />
              ))}
            </>
          ) : (
            <>
              {(locationError || nearbyClinicsMessage) && (
                <View
                  style={[styles.infoCard, locationError ? styles.errorCard : undefined]}
                >
                  <Text
                    style={[
                      styles.infoText,
                      locationError ? styles.errorText : undefined,
                    ]}
                  >
                    {locationError || nearbyClinicsMessage}
                  </Text>
                  {!locationPermissionDenied && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleRequestLocation}
                      disabled={locationFetching}
                    >
                      {locationFetching ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Retry Location</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {locationPermissionDenied && (
                    <Text style={styles.infoSubtext}>
                      Enable location access in your device settings, then return to refresh this
                      list.
                    </Text>
                  )}
                </View>
              )}
              {!locationError && !nearbyClinicsMessage && nearbyClinics.length === 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    Share your location to discover clinics closest to you.
                  </Text>
                </View>
              )}
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
                  <View style={styles.appointmentHeaderRow}>
                    <Text style={styles.appointmentClinic}>{appointment.clinic?.clinic_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Text style={styles.statusText}>{appointment.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.appointmentDate}>
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {` • ${appointment.appointment_time}`}
                  </Text>
                  <View style={styles.appointmentMeta}>
                    <Text style={styles.appointmentType}>{appointment.appointment_type}</Text>
                    <TouchableOpacity
                      style={styles.appointmentDetailsButton}
                      onPress={() => router.push({
                        pathname: '/(tabs)/patient/history/[id]',
                        params: { id: appointment.id },
                      })}
                    >
                      <Text style={styles.appointmentDetailsText}>Details</Text>
                      <Navigation size={14} color="#2563EB" />
                    </TouchableOpacity>
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
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#E0F2FE',
    marginBottom: 6,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E0F2FE',
    lineHeight: 18,
    marginBottom: 14,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  heroIllustration: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff20',
    borderWidth: 1,
    borderColor: '#F8FAFC33',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#E0F2FE',
    letterSpacing: 0.3,
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  viewAllTextDisabled: {
    opacity: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionSkeleton: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
  appointmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentClinic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    marginTop: 12,
  },
  appointmentType: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  appointmentDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  appointmentDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  infoSubtext: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#B91C1C',
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
