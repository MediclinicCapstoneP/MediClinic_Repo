import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { 
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  Phone,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { clinicService } from '@/services/clinicService';
import { ClinicWithDetails } from '@/lib/supabase';
import { AppointmentBookingModal } from '@/components/appointment/AppointmentBookingModal';

interface FilterState {
  specialty: string;
  location: string;
  rating: number;
  distance: number;
  sortBy: 'name' | 'rating' | 'distance';
}

export default function ClinicsScreen() {
  const router = useRouter();
  const [clinics, setClinics] = useState<ClinicWithDetails[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<ClinicWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDetails | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    specialty: '',
    location: '',
    rating: 0,
    distance: 50,
    sortBy: 'name',
  });

  const specialties = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
    'Neurology',
    'Psychiatry',
    'Ophthalmology',
    'ENT',
  ];

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clinics, searchQuery, filters]);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getClinics({
        include_details: true,
        radius: filters.distance,
      });
      
      if (response.success && response.clinics) {
        setClinics(response.clinics);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClinics();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...clinics];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(clinic =>
        clinic.clinic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.specialties?.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Specialty filter
    if (filters.specialty) {
      filtered = filtered.filter(clinic =>
        clinic.specialties?.includes(filters.specialty) ||
        clinic.custom_specialties?.includes(filters.specialty)
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(clinic =>
        clinic.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        clinic.address?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(clinic =>
        (clinic.average_rating || 0) >= filters.rating
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'distance':
          // Assuming distance is calculated and available
          return 0; // Placeholder for distance sorting
        case 'name':
        default:
          return a.clinic_name.localeCompare(b.clinic_name);
      }
    });

    setFilteredClinics(filtered);
  };

  const handleBookAppointment = (clinic: ClinicWithDetails) => {
    setSelectedClinic(clinic);
    setShowBookingModal(true);
  };

  const handleViewOnMap = (clinic: ClinicWithDetails) => {
    // Navigate to map and center on this clinic
    router.push('/map');
    // Note: You could pass clinic ID as a parameter to center the map on this specific clinic
  };

  const renderClinicCard = (clinic: ClinicWithDetails) => (
    <View key={clinic.id} style={styles.clinicCard}>
      <View style={styles.clinicHeader}>
        <View style={styles.clinicImageContainer}>
          {clinic.profile_pic_url ? (
            <Image source={{ uri: clinic.profile_pic_url }} style={styles.clinicImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {clinic.clinic_name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
          
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFA500" fill="#FFA500" />
            <Text style={styles.rating}>
              {clinic.average_rating?.toFixed(1) || 'N/A'}
            </Text>
            <Text style={styles.reviewCount}>
              ({clinic.total_reviews || 0} reviews)
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}>
              {clinic.city && clinic.address ? `${clinic.city}` : 'Location not specified'}
            </Text>
          </View>
        </View>
      </View>

      {/* Specialties */}
      {clinic.specialties && clinic.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {clinic.specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {clinic.specialties.length > 3 && (
              <View style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>
                  +{clinic.specialties.length - 3} more
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Operating Hours */}
      <View style={styles.hoursContainer}>
        <Clock size={14} color="#6B7280" />
        <Text style={styles.hoursText}>Open • Closes at 6:00 PM</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => handleViewOnMap(clinic)}
        >
          <MapPin size={16} color="#10B981" />
          <Text style={styles.mapButtonText}>Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callButton}>
          <Phone size={16} color="#2563EB" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleBookAppointment(clinic)}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Specialty Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Specialty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filters.specialty && styles.filterChipSelected
            ]}
            onPress={() => setFilters(prev => ({ ...prev, specialty: '' }))}
          >
            <Text style={[
              styles.filterChipText,
              !filters.specialty && styles.filterChipTextSelected
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {specialties.map(specialty => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.filterChip,
                filters.specialty === specialty && styles.filterChipSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, specialty }))}
            >
              <Text style={[
                styles.filterChipText,
                filters.specialty === specialty && styles.filterChipTextSelected
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Sort by</Text>
        <View style={styles.sortOptions}>
          {[
            { value: 'name', label: 'Name' },
            { value: 'rating', label: 'Rating' },
            { value: 'distance', label: 'Distance' },
          ].map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                filters.sortBy === option.value && styles.sortOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value as any }))}
            >
              <Text style={[
                styles.sortOptionText,
                filters.sortBy === option.value && styles.sortOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clinics, specialties, locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredClinics.length} clinics found
        </Text>
      </View>

      {/* Clinics List */}
      <ScrollView
        style={styles.clinicsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading clinics...</Text>
          </View>
        ) : filteredClinics.length > 0 ? (
          filteredClinics.map(renderClinicCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No clinics found matching your criteria
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      {selectedClinic && (
        <AppointmentBookingModal
          visible={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedClinic(null);
          }}
          clinic={selectedClinic}
          onBookingSuccess={() => {
            setShowBookingModal(false);
            setSelectedClinic(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  sortOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  clinicsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clinicHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  clinicImageContainer: {
    marginRight: 12,
  },
  clinicImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  specialtiesContainer: {
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: '#2563EB',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    marginRight: 8,
  },
  mapButtonText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  callButtonText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 4,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
