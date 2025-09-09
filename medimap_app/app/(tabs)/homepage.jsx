import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, FlatList, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';
import AppointmentBookingModal from '../../components/AppointmentBookingModal';


function ProfileHeader({ userName, onProfilePress }) {
  // Get the first letter of the first name for profile avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        <Text style={{color: 'blue'}}>iGabayAti</Text>
        <Text style={{color: 'black'}}>Care</Text>🍀
      </Text>
      <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
        <Text style={styles.profileButtonText}>{getInitials(userName)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { user, loading, signOut } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      loadUserData();
      loadClinics();
      loadAppointments();
    }
  }, [loading]);

  useEffect(() => {
    filterClinics();
  }, [searchQuery, selectedFilter, clinics]);

  const loadUserData = async () => {
    try {
      if (!user) {
        // If not authenticated, redirect to login
        router.replace('/');
        return;
      }

      // Try to get patient profile
      const profile = user.profile;
      if (profile && 'first_name' in profile) {
        setPatientName(profile.first_name + ' ' + (profile.last_name || ''));
      } else {
        // Fallback: fetch profile by user id
        const result = await dataService.getPatientProfile(user.user.id);
        if (result.success && result.data) {
          setPatientName(result.data.first_name + ' ' + (result.data.last_name || ''));
        } else {
          setPatientName(user.user.email || 'User');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setPatientName('User');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClinics = async () => {
    setLoadingClinics(true);
    try {
      const result = await dataService.getClinics();
      if (result.success && result.data) {
        setClinics(result.data);
      } else {
        console.error('Failed to load clinics:', result.error);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    } finally {
      setLoadingClinics(false);
    }
  };

  const loadAppointments = async () => {
    if (!user?.profile?.id) return;
    
    try {
      const result = await dataService.getPatientAppointments(user.profile.id);
      if (result.success && result.data) {
        setAppointments(result.data.slice(0, 3)); // Show last 3 appointments
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const filterClinics = () => {
    let filtered = [...clinics];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(clinic => 
        clinic.clinic_name.toLowerCase().includes(query) ||
        clinic.city?.toLowerCase().includes(query) ||
        clinic.specialties?.some(spec => spec.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(clinic => 
        clinic.specialties?.some(spec => 
          spec.toLowerCase().includes(selectedFilter.toLowerCase())
        )
      );
    }

    setFilteredClinics(filtered);
  };

  const handleBookAppointment = (clinic) => {
    setSelectedClinic(clinic);
    setShowBookingModal(true);
  };

  const handleProfilePress = () => {
    Alert.alert(
      'Profile Options',
      'What would you like to do?',
      [
        { text: 'Logout', onPress: async () => { await signOut(); router.replace('/'); } },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  if (loading || isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a4fb4" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading your homepage...</Text>
      </View>
    );
  }

  const filterOptions = [
    { key: 'all', label: 'All Clinics' },
    { key: 'general', label: 'General Medicine' },
    { key: 'pediatrics', label: 'Pediatrics' },
    { key: 'cardiology', label: 'Cardiology' },
    { key: 'dermatology', label: 'Dermatology' },
    { key: 'orthopedics', label: 'Orthopedics' },
  ];

  const renderClinicCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.clinicCard}
      onPress={() => handleBookAppointment(item)}
    >
      <View style={styles.clinicHeader}>
        <Text style={styles.clinicName}>{item.clinic_name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>4.5</Text>
        </View>
      </View>
      
      <Text style={styles.clinicLocation}>
        📍 {item.address || item.city || 'Location not specified'}
      </Text>
      
      {item.specialties && item.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {item.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.clinicFooter}>
        <Text style={styles.consultationFee}>₱500 consultation</Text>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleBookAppointment(item)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAppointmentCard = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentClinic}>{item.clinic?.clinic_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.appointmentDate}>
        📅 {new Date(item.appointment_date).toLocaleDateString()}
      </Text>
      <Text style={styles.appointmentTime}>
        🕐 {item.appointment_time}
      </Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <ProfileHeader userName={patientName} onProfilePress={handleProfilePress} />

        <Text style={styles.greeting}>👋 Hello!</Text>
        <Text style={styles.userName}>{patientName || 'Welcome'}</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <TextInput 
            placeholder="Search clinics..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/viewappointment')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={appointments}
              renderItem={renderAppointmentCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.appointmentsList}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/makeappointment')}
          >
            <MaterialIcons name="event" size={24} color="black" />
            <Text>Book Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/viewappointment')}
          >
            <FontAwesome5 name="clipboard-list" size={22} color="black" />
            <Text>My Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color="black" />
            <Text>Filter Clinics</Text>
          </TouchableOpacity>
        </View>

        {/* Available Clinics */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Clinics</Text>
            <Text style={styles.clinicCount}>{filteredClinics.length} clinics</Text>
          </View>
          
          {loadingClinics ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a4fb4" />
              <Text style={styles.loadingText}>Loading clinics...</Text>
            </View>
          ) : filteredClinics.length > 0 ? (
            <FlatList
              data={filteredClinics}
              renderItem={renderClinicCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No clinics found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Clinics</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    selectedFilter === option.key && styles.selectedFilterOption
                  ]}
                  onPress={() => {
                    setSelectedFilter(option.key);
                    setShowFilters(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter === option.key && styles.selectedFilterText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        clinic={selectedClinic}
        onSuccess={() => {
          loadAppointments(); // Refresh appointments
          loadClinics(); // Refresh clinics if needed
        }}
      />

      {/* Floating AI Button - bottom right */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: '#eae8e8ff',
    width: 60,
    height: 60,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 1.5,
    shadowOffset: { width: 0, height: 4},
    shadowRadius: 5,
  },
  profileButtonText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: 30,
  },
  greeting: {
    marginTop: 10,
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#e1f5fe',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: 100,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#9a9898f1',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  bottomCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#9a9898f1',
    borderRadius: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardText: {
    fontSize: 14,
    marginTop: 5,
  },
  doctorImage: {
    width: 80,
    height: 80,
    marginLeft: 10,
    borderRadius: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a4fb4',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
  // Section styles
  sectionContainer: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    color: '#1a4fb4',
    fontWeight: '600',
  },
  clinicCount: {
    color: '#666',
    fontSize: 14,
  },
  // Clinic card styles
  clinicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  clinicLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#1a4fb4',
    fontWeight: '500',
  },
  clinicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consultationFee: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#1a4fb4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Appointment card styles
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentClinic: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#666',
  },
  appointmentsList: {
    marginTop: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFilterOption: {
    backgroundColor: '#1a4fb4',
    borderColor: '#1a4fb4',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
  },
  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
});
