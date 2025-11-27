import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { clinicService, ClinicFilters } from '@/services/clinicService';
import { ClinicWithDetails } from '@/lib/supabase';
import { AppointmentBookingModal } from '@/components/appointment/AppointmentBookingModal';
import { Button } from '@/components/ui/Button';

const SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Gynecology',
  'Ophthalmology',
  'Dentistry',
  'Psychiatry',
  'Neurology',
];

const SERVICES = [
  'Consultation',
  'Laboratory Tests',
  'X-Ray',
  'Ultrasound',
  'ECG',
  'Vaccination',
  'Minor Surgery',
  'Physical Therapy',
  'Dental Care',
  'Eye Exam',
];

export default function ClinicsScreen() {
  const [searchText, setSearchText] = useState('');
  const [clinics, setClinics] = useState<ClinicWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDetails | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<ClinicFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    loadClinics();
  }, [filters]);

  const loadClinics = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      }
      
      const response = await clinicService.getClinics({
        ...filters,
        search: searchText || undefined,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
        services: selectedServices.length > 0 ? selectedServices : undefined,
        rating: minRating > 0 ? minRating : undefined,
        city: selectedCity || undefined,
      });

      if (response.success && response.clinics) {
        if (reset || filters.page === 1) {
          setClinics(response.clinics);
        } else {
          setClinics(prev => [...prev, ...response.clinics!]);
        }
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setFilters(prev => ({ ...prev, page: 1 }));
    await loadClinics(true);
    setRefreshing(false);
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadClinics(true);
  };

  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
  };

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    setShowFilters(false);
    loadClinics(true);
  };

  const clearFilters = () => {
    setSelectedSpecialties([]);
    setSelectedServices([]);
    setMinRating(0);
    setSelectedCity('');
    setFilters({ page: 1, limit: 20 });
    setShowFilters(false);
    loadClinics(true);
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleClinicPress = (clinic: ClinicWithDetails) => {
    setSelectedClinic(clinic);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (appointmentId: string) => {
    console.log('Appointment booked:', appointmentId);
    setShowBookingModal(false);
    setSelectedClinic(null);
  };

  const renderClinicCard = ({ item: clinic }: { item: ClinicWithDetails }) => (
    <TouchableOpacity
      style={styles.clinicCard}
      onPress={() => handleClinicPress(clinic)}
    >
      <View style={styles.clinicHeader}>
        <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={16} color="#FFC107" fill="#FFC107" />
          <Text style={styles.ratingText}>{(clinic.average_rating || 0).toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({clinic.total_reviews || 0})</Text>
        </View>
      </View>

      <View style={styles.clinicLocation}>
        <MapPin size={14} color="#6B7280" />
        <Text style={styles.locationText}>{clinic.address}</Text>
      </View>

      <Text style={styles.clinicCity}>{clinic.city}, {clinic.state}</Text>

      {clinic.specialties && clinic.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {clinic.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {clinic.specialties.length > 3 && (
            <Text style={styles.moreSpecialties}>+{clinic.specialties.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.clinicFooter}>
        <View style={styles.operatingHours}>
          <Clock size={14} color="#10B981" />
          <Text style={styles.hoursText}>Open Today</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* City Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>City</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Enter city name"
              value={selectedCity}
              onChangeText={setSelectedCity}
            />
          </View>

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Minimum Rating</Text>
            <View style={styles.ratingFilter}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    minRating >= rating && styles.ratingButtonSelected,
                  ]}
                  onPress={() => setMinRating(rating)}
                >
                  <Star
                    size={20}
                    color={minRating >= rating ? "#FFC107" : "#D1D5DB"}
                    fill={minRating >= rating ? "#FFC107" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Specialties Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Specialties</Text>
            <View style={styles.checkboxGrid}>
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.checkbox,
                    selectedSpecialties.includes(specialty) && styles.checkboxSelected,
                  ]}
                  onPress={() => toggleSpecialty(specialty)}
                >
                  <Text
                    style={[
                      styles.checkboxText,
                      selectedSpecialties.includes(specialty) && styles.checkboxTextSelected,
                    ]}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Services Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Services</Text>
            <View style={styles.checkboxGrid}>
              {SERVICES.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.checkbox,
                    selectedServices.includes(service) && styles.checkboxSelected,
                  ]}
                  onPress={() => toggleService(service)}
                >
                  <Text
                    style={[
                      styles.checkboxText,
                      selectedServices.includes(service) && styles.checkboxTextSelected,
                    ]}
                  >
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Apply Filters"
            onPress={applyFilters}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Clinics</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clinics, doctors, or services..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedSpecialties.length > 0 || selectedServices.length > 0 || minRating > 0 || selectedCity) && (
        <ScrollView horizontal style={styles.activeFilters} showsHorizontalScrollIndicator={false}>
          {selectedCity && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>City: {selectedCity}</Text>
              <TouchableOpacity onPress={() => setSelectedCity('')}>
                <X size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          )}
          {minRating > 0 && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>{minRating}+ Stars</Text>
              <TouchableOpacity onPress={() => setMinRating(0)}>
                <X size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          )}
          {selectedSpecialties.map((specialty) => (
            <View key={specialty} style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>{specialty}</Text>
              <TouchableOpacity onPress={() => toggleSpecialty(specialty)}>
                <X size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ))}
          {selectedServices.map((service) => (
            <View key={service} style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>{service}</Text>
              <TouchableOpacity onPress={() => toggleService(service)}>
                <X size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Clinics List */}
      <FlatList
        data={clinics}
        renderItem={renderClinicCard}
        keyExtractor={(item) => item.id}
        style={styles.clinicsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No clinics found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
          </View>
        }
      />

      {/* Filters Modal */}
      {renderFiltersModal()}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilters: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 6,
  },
  clinicsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  clinicLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  clinicCity: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#6B7280',
  },
  clinicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operatingHours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  ratingFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingButton: {
    padding: 4,
  },
  ratingButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkbox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  checkboxSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
  },
  checkboxTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
});
