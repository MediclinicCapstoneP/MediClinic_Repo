import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Calendar, Star, Users, Award, Shield, Phone, Mail, ExternalLink, Navigation, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { patientService } from '../../features/auth/utils/patientService';
import { authService } from '../../features/auth/utils/authService';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { PaymentForm } from '../../components/patient/PaymentForm';
import { PayMongoGCashPayment } from '../../components/patient/PayMongoGCashPayment';
import { PaymentResponse } from '../../types/payment';
import type { CreateAppointmentData, AppointmentType } from '../../types/appointments';
import type { ClinicService } from '../../types/clinicServices';
import ClinicFilters from '../../components/patient/ClinicFilters';
import { AppointmentBookingModal } from '../../components/patient/AppointmentBookingModal';
// NotificationDropdown now integrated in PatientNavbar
// import { NotificationDropdown } from '../../components/patient/NotificationDropdown';
import { ClinicMapModal } from '../../components/patient/ClinicMapModal';

// Default clinic image for clinics without uploaded images
const DEFAULT_CLINIC_IMAGE = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400';

interface PatientHomeProps {
  onNavigate: (tab: string) => void;
}

type Step = 'home' | 'clinic-details' | 'book' | 'confirm' | 'payment';

interface PatientData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FilterOptions {
  location: {
    latitude: number | null;
    longitude: number | null;
    radius: number;
    useCurrentLocation: boolean;
  };
  services: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: {
    minimum: number;
  };
  sortBy: 'distance' | 'price_low' | 'price_high' | 'rating' | 'name';
}

interface ClinicWithDistance extends ClinicProfile {
  distance?: number;
  averageRating?: number;
  estimatedPrice?: number;
  services_with_pricing?: ClinicService[];
}

const PatientHome: React.FC<PatientHomeProps> = ({ onNavigate }) => {
  const [clinics, setClinics] = useState<ClinicWithDistance[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<ClinicWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step | 'payment' | 'gcash-payment'>('home');
  const [selectedClinic, setSelectedClinic] = useState<ClinicProfile | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    location: { latitude: null, longitude: null, radius: 10, useCurrentLocation: false },
    services: [],
    priceRange: { min: 0, max: 5000 },
    rating: { minimum: 0 },
    sortBy: 'distance'
  });
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedClinicForMap, setSelectedClinicForMap] = useState<ClinicWithDistance | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get minimum price for a clinic based on actual services
  const getMinimumPrice = useCallback((clinic: ClinicWithDistance): number => {
    if (clinic.services_with_pricing && clinic.services_with_pricing.length > 0) {
      const prices = clinic.services_with_pricing.map(service => service.base_price);
      return Math.min(...prices);
    }
    // Fallback to estimated price if no services available
    return 500; // Default consultation fee
  }, []);

  // Get mock rating for a clinic (will be replaced with actual ratings from database)
  const getMockRating = useCallback((clinic: ClinicProfile): number => {
    // Generate consistent rating based on clinic ID
    const hash = clinic.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.max(3.0, Math.min(5.0, 3.5 + (Math.abs(hash) % 150) / 100));
  }, []);




  // Fetch current patient data
  useEffect(() => {
    const fetchCurrentPatient = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          console.error('No authenticated user found');
          return;
        }

        const patientResult = await patientService.getPatientByUserId(currentUser.id);
        if (patientResult.success && patientResult.patient) {
          setCurrentPatient({
            id: patientResult.patient.id,
            user_id: patientResult.patient.user_id,
            first_name: patientResult.patient.first_name,
            last_name: patientResult.patient.last_name,
            email: patientResult.patient.email,
          });
        } else {
          console.error('Failed to fetch patient data:', patientResult.error);
        }
      } catch (error) {
        console.error('Error fetching current patient:', error);
      }
    };

    fetchCurrentPatient();
  }, []);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        
        // Try to get clinics with services, fallback to regular clinics if table doesn't exist
        let result;
        try {
          result = await clinicService.getClinicsWithServices();
        } catch (error) {
          console.warn('Falling back to regular clinic fetch due to missing clinic_services table');
          result = await clinicService.getPublicClinics();
        }
        
        if (result.success && result.clinics) {
          // Enhance clinics with additional data
          const enhancedClinics: ClinicWithDistance[] = result.clinics.map(clinic => ({
            ...clinic,
            averageRating: getMockRating(clinic),
            estimatedPrice: getMinimumPrice(clinic),
            services_with_pricing: clinic.services_with_pricing || []
          }));
          
          setClinics(enhancedClinics);
          
          // Extract all available services for filter (from both old and new service systems)
          const allServices = new Set<string>();
          enhancedClinics.forEach(clinic => {
            // Legacy services from clinic profile
            clinic.services?.forEach(service => allServices.add(service));
            clinic.custom_services?.forEach(service => allServices.add(service));
            clinic.specialties?.forEach(specialty => allServices.add(specialty));
            clinic.custom_specialties?.forEach(specialty => allServices.add(specialty));
            
            // New service-specific pricing
            clinic.services_with_pricing?.forEach(service => allServices.add(service.service_name));
          });
          setAvailableServices(Array.from(allServices).sort());
        } else {
          console.error('❌ Failed to fetch clinics:', result.error);
          setClinics([]);
        }
      } catch (error) {
        console.error('💥 Unexpected error fetching clinics:', error);
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [getMockRating, getMinimumPrice]);

  const handleClinicClick = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
      setStep('clinic-details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (clinic: ClinicProfile) => {
    const parts = [clinic.address, clinic.city, clinic.state, clinic.zip_code].filter(Boolean);
    return parts.join(', ');
  };

  const getSpecialization = (clinic: ClinicProfile) => {
    if (clinic.specialties && clinic.specialties.length > 0) {
      return clinic.specialties.join(', ');
    }
    if (clinic.custom_specialties && clinic.custom_specialties.length > 0) {
      return clinic.custom_specialties.join(', ');
    }
    return 'General Medicine';
  };

  // Convert service name to valid AppointmentType format
  const convertToAppointmentType = useCallback((serviceName: string): AppointmentType => {
    const normalized = serviceName.toLowerCase().replace(/\s+/g, '_');
    
    // Map common service names to valid AppointmentType values
    const mappings: Record<string, AppointmentType> = {
      'consultation': 'consultation',
      'checkup': 'routine_checkup',
      'routine_checkup': 'routine_checkup', 
      'routine': 'routine_checkup',
      'follow_up': 'follow_up',
      'followup': 'follow_up',
      'emergency': 'emergency',
      'specialist': 'specialist_visit',
      'specialist_visit': 'specialist_visit',
      'vaccination': 'vaccination',
      'vaccine': 'vaccination',
      'procedure': 'procedure',
      'surgery': 'surgery',
      'lab_test': 'lab_test',
      'laboratory': 'lab_test',
      'imaging': 'imaging',
      'xray': 'imaging',
      'x-ray': 'imaging',
      'physical_therapy': 'physical_therapy',
      'therapy': 'physical_therapy',
      'mental_health': 'mental_health',
      'dental': 'dental',
      'vision': 'vision',
      'other': 'other'
    };
    
    return mappings[normalized] || 'other';
  }, []);

  const getServiceOptions = useCallback((clinic: ClinicProfile) => {
    const availableServices = [
      ...(clinic.services || []),
      ...(clinic.custom_services || [])
    ];
    
    const defaultServices = [
      { display: 'Consultation', value: 'consultation' },
      { display: 'Routine Checkup', value: 'routine_checkup' },
      { display: 'Follow-up', value: 'follow_up' },
      { display: 'Emergency', value: 'emergency' },
      { display: 'Specialist Visit', value: 'specialist_visit' },
      { display: 'Vaccination', value: 'vaccination' },
      { display: 'Other', value: 'other' }
    ];
    
    return availableServices.length > 0 
      ? availableServices.map(service => ({
          display: service,
          value: convertToAppointmentType(service)
        }))
      : defaultServices;
  }, [convertToAppointmentType]);

  // Apply filters and sorting to clinics
  const applyFilters = useCallback(() => {
    if (!filtersApplied) {
      // Show all clinics by default when no filters are applied
      setFilteredClinics(clinics);
      return;
    }

    let filtered = [...clinics];

    // Calculate distances if location is available
    if (filters.location.useCurrentLocation && filters.location.latitude && filters.location.longitude) {
      filtered = filtered.map(clinic => ({
        ...clinic,
        distance: clinic.latitude && clinic.longitude 
          ? calculateDistance(
              filters.location.latitude!,
              filters.location.longitude!,
              clinic.latitude,
              clinic.longitude
            )
          : undefined
      }));

      // Filter by distance radius
      filtered = filtered.filter(clinic => 
        !clinic.distance || clinic.distance <= filters.location.radius
      );
    }

    // Filter by services
    if (filters.services.length > 0) {
      filtered = filtered.filter(clinic => {
        const clinicServices = [
          ...(clinic.services || []),
          ...(clinic.custom_services || []),
          ...(clinic.specialties || []),
          ...(clinic.custom_specialties || []),
          ...(clinic.services_with_pricing?.map(s => s.service_name) || [])
        ];
        return filters.services.some(service => 
          clinicServices.some(clinicService => 
            clinicService.toLowerCase().includes(service.toLowerCase())
          )
        );
      });
    }

    // Filter by price range (now based on actual service prices)
    if (filters.priceRange.min > 0 || filters.priceRange.max < 5000) {
      filtered = filtered.filter(clinic => {
        if (clinic.services_with_pricing && clinic.services_with_pricing.length > 0) {
          // Check if any service falls within the price range
          return clinic.services_with_pricing.some(service => 
            service.base_price >= filters.priceRange.min && 
            service.base_price <= filters.priceRange.max
          );
        } else {
          // Fallback to estimated price
          const price = clinic.estimatedPrice || 0;
          return price >= filters.priceRange.min && price <= filters.priceRange.max;
        }
      });
    }

    // Filter by rating
    if (filters.rating.minimum > 0) {
      filtered = filtered.filter(clinic => 
        (clinic.averageRating || 0) >= filters.rating.minimum
      );
    }

    // Sort clinics
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          if (!a.distance && !b.distance) return 0;
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        
        case 'price_low':
          return (a.estimatedPrice || 0) - (b.estimatedPrice || 0);
        
        case 'price_high':
          return (b.estimatedPrice || 0) - (a.estimatedPrice || 0);
        
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        
        case 'name':
          return a.clinic_name.localeCompare(b.clinic_name);
        
        default:
          return 0;
      }
    });

    setFilteredClinics(filtered);
  }, [clinics, filters, calculateDistance, filtersApplied]);

  // Initial load - show all clinics
  useEffect(() => {
    if (clinics.length > 0 && !filtersApplied) {
      setFilteredClinics(clinics);
    }
  }, [clinics, filtersApplied]);

  // Apply filters when they change
  useEffect(() => {
    if (filtersApplied) {
      applyFilters();
    }
  }, [filters, filtersApplied, applyFilters]);

  // Reset appointment type when clinic changes or services change
  useEffect(() => {
    if (selectedClinic && step === 'book') {
      const serviceOptions = getServiceOptions(selectedClinic);
      
      // Reset appointment type if current selection is not available for this clinic
      if (serviceOptions.length > 0) {
        const currentServiceExists = serviceOptions.some(option => option.value === appointmentType);
        if (!currentServiceExists) {
          const firstValidType = serviceOptions[0].value as AppointmentType;
          setAppointmentType(firstValidType);
        }
      }
    }
  }, [selectedClinic?.id, step, appointmentType, convertToAppointmentType, getServiceOptions]);

  // Handle appointment booking
  const handleBookAppointment = async () => {
    if (!currentPatient || !selectedClinic || !date || !time) {
      setBookingError('Please complete all required fields');
      return;
    }

    if (!paymentDone) {
      setBookingError('Please complete the payment first');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const appointmentData: CreateAppointmentData = {
        patient_id: currentPatient.id,
        clinic_id: selectedClinic.id,
        appointment_date: date,
        appointment_time: time + ':00', // Add seconds
        appointment_type: appointmentType,
        // priority: 'normal', // Removed due to missing column in database
      };

      console.log('Creating appointment with data:', appointmentData);
      const result = await AppointmentService.createAppointment(appointmentData);
      
      if (result) {
        console.log('✅ Appointment created successfully:', result);
        setStep('confirm');
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      setBookingError(error instanceof Error ? error.message : 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderClinicList = () => (
    <>
      {/* Filter Component */}
      <ClinicFilters
        onFiltersChange={setFilters}
        onApplyFilters={() => setFiltersApplied(true)}
        availableServices={availableServices}
        loading={loading}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {filters.location.useCurrentLocation ? 'Nearby Clinics' : 'Available Clinics'}
          {filteredClinics.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredClinics.length} found)
            </span>
          )}
        </h2>
        {filters.sortBy === 'distance' && filters.location.useCurrentLocation && (
          <div className="flex items-center text-sm text-blue-600">
            <Navigation className="h-4 w-4 mr-1" />
            Sorted by distance
          </div>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Clinics Match Your Filters
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your location radius, service requirements, price range, or rating filters.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-md">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">💡 Filter Tips:</p>
              <div className="text-left space-y-1">
                <p>• Increase location radius for more results</p>
                <p>• Remove specific service requirements</p>
                <p>• Expand your price range</p>
                <p>• Lower minimum rating requirement</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          {filteredClinics.map((clinic) => (
            <div key={clinic.id} onClick={() => handleClinicClick(clinic.id)}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-blue-300 bg-white">
                <CardContent className="p-2 sm:p-4 lg:p-6">
                  {/* Clinic Image */}
                  <div className="relative mb-2 sm:mb-3 lg:mb-4">
                    <img
                      src={clinic.profile_pic_url || DEFAULT_CLINIC_IMAGE}
                      alt={clinic.clinic_name}
                      className="w-full h-24 sm:h-32 lg:h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_CLINIC_IMAGE;
                      }}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      {clinic.status === 'approved' ? (
                        <div className="bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex items-center">
                          <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">Verified</span>
                          <span className="sm:hidden">✓</span>
                        </div>
                      ) : (
                        <div className="bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                          <span className="hidden sm:inline">Pending</span>
                          <span className="sm:hidden">⏳</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Clinic Name */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-2 mb-1">
                      {clinic.clinic_name || 'Medical Clinic'}
                    </h3>
                    {clinic.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {clinic.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Location */}
                  <div className="mb-1.5 sm:mb-2 lg:mb-3">
                    <p className="text-xs text-gray-600 flex items-center line-clamp-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{clinic.address ? `${clinic.address}, ${clinic.city}` : clinic.city}</span>
                      {clinic.distance && (
                        <span className="ml-1 sm:ml-2 text-blue-600 font-medium text-xs whitespace-nowrap">
                          ({clinic.distance.toFixed(1)}km)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {/* Address */}
                    {formatAddress(clinic) && clinic.distance && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {clinic.distance.toFixed(1)} km away
                      </div>
                    )}
                    
                    {/* Phone */}
                    {clinic.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>{clinic.phone}</span>
                      </div>
                    )}
                    
                    {/* Email */}
                    {clinic.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                        <span className="truncate">{clinic.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Services with Pricing */}
                  <div className="mb-4">
                    {clinic.services_with_pricing && clinic.services_with_pricing.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Available Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {clinic.services_with_pricing.slice(0, 3).map((service, index) => (
                            <div key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center">
                              <span>{service.service_name}</span>
                              <span className="ml-2 font-bold">₱{service.base_price}</span>
                            </div>
                          ))}
                          {clinic.services_with_pricing.length > 3 && (
                            <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                              +{clinic.services_with_pricing.length - 3} more services
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(clinic.specialties || []).slice(0, 2).map((specialty, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                            {specialty}
                          </span>
                        ))}
                        {(clinic.custom_specialties || []).slice(0, 2 - (clinic.specialties || []).length).map((specialty, index) => (
                          <span key={`custom-${index}`} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-200">
                            {specialty}
                          </span>
                        ))}
                        {((clinic.specialties || []).length + (clinic.custom_specialties || []).length) > 2 && (
                          <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                            +{((clinic.specialties || []).length + (clinic.custom_specialties || []).length) - 2} more
                          </span>
                        )}
                        {(!clinic.specialties || clinic.specialties.length === 0) && 
                         (!clinic.custom_specialties || clinic.custom_specialties.length === 0) && (
                          <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                            General Medicine
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Staff Information */}
                  {(clinic.number_of_doctors || clinic.number_of_staff) && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Users className="h-4 w-4 mr-2" />
                      <span>
                        {clinic.number_of_doctors ? `${clinic.number_of_doctors} Doctor${clinic.number_of_doctors > 1 ? 's' : ''}` : ''}
                        {clinic.number_of_doctors && clinic.number_of_staff ? ' • ' : ''}
                        {clinic.number_of_staff ? `${clinic.number_of_staff} Staff` : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Price, Rating, and Distance */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 text-xs">
                    <div className="flex items-center text-green-600">
                      <DollarSign className="h-3 w-3 mr-0.5 sm:mr-1" />
                      <span className="font-medium text-xs sm:text-sm">
                        ₱{clinic.estimatedPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <Star className="h-3 w-3 mr-0.5 sm:mr-1 fill-current" />
                      <span className="text-xs sm:text-sm">{clinic.averageRating?.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-1 sm:space-y-2">
                    <Button 
                      onClick={() => {
                        setSelectedClinic(clinic);
                        setShowBookingModal(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 sm:py-2 lg:py-3 text-xs sm:text-sm lg:text-base rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Book Appointment</span>
                      <span className="sm:hidden">Book</span>
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClinicForMap(clinic);
                        setShowMapModal(true);
                      }}
                      variant="outline" 
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-1 sm:py-1.5 lg:py-2 text-xs rounded-lg transition-colors"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">View Location</span>
                      <span className="sm:hidden">Map</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderClinicDetails = (clinic: ClinicProfile) => {
    return (
      <div className="space-y-6">
        {/* Header with clinic image */}
        <div className="h-64 rounded-xl overflow-hidden mb-6">
          <img 
            src={clinic.profile_pic_url || DEFAULT_CLINIC_IMAGE} 
            alt={clinic.clinic_name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if profile picture fails to load
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_CLINIC_IMAGE;
            }}
          />
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3">{clinic.clinic_name}</h2>
            <p className="text-lg text-gray-600 mb-3">{clinic.description || getSpecialization(clinic)}</p>
            <p className="text-sm text-gray-500 mb-4">{formatAddress(clinic)}</p>
            
            {/* Status Badge */}
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(clinic.status)}`}>
              {clinic.status === 'approved' ? '✓ Verified Clinic' : clinic.status}
            </span>
          </div>
        </div>
        
        {/* Clinic Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                {clinic.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span>{clinic.phone}</span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-gray-500" />
                    <span>{clinic.email}</span>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-3 text-gray-500" />
                    <a 
                      href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      {clinic.website}
                    </a>
                  </div>
                )}
                {formatAddress(clinic) && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                      <span>{formatAddress(clinic)}</span>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedClinicForMap(clinic as ClinicWithDistance);
                        setShowMapModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Specialties & Services
              </h3>
              <div className="space-y-3">
                {/* Standard Specialties */}
                {(clinic.specialties && clinic.specialties.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Medical Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((specialty, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Specialties */}
                {(clinic.custom_specialties && clinic.custom_specialties.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Custom Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.custom_specialties.map((specialty, index) => (
                        <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Services */}
                {(clinic.services && clinic.services.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.services.map((service, index) => (
                        <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Default if no specialties */}
                {(!clinic.specialties || clinic.specialties.length === 0) && 
                 (!clinic.custom_specialties || clinic.custom_specialties.length === 0) && (
                  <div className="text-gray-500 text-sm">General medical services available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Information */}
        {(clinic.license_number || clinic.accreditation || clinic.year_established) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                Credentials & Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clinic.license_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">License Number</p>
                    <p className="text-sm text-gray-600">{clinic.license_number}</p>
                  </div>
                )}
                {clinic.accreditation && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Accreditation</p>
                    <p className="text-sm text-gray-600">{clinic.accreditation}</p>
                  </div>
                )}
                {clinic.year_established && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Established</p>
                    <p className="text-sm text-gray-600">{clinic.year_established}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6">
          <Button 
            onClick={() => setShowBookingModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setStep('home')}
            className="px-8 py-3 text-lg"
          >
            Back to Clinics
          </Button>
        </div>
      </div>
    );
  };

  const renderBookingForm = (clinic: ClinicProfile) => {
    // Get available services from the clinic
    const availableServices = [
      ...(clinic.services || []),
      ...(clinic.custom_services || [])
    ];
    
    const serviceOptions = getServiceOptions(clinic);

    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Book Appointment - {clinic.clinic_name}</h2>
        
        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {bookingError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
              <span className="text-xs text-gray-500 ml-2">
                ({availableServices.length > 0 ? 'Clinic-specific services' : 'General services'})
              </span>
            </label>
            <select 
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {serviceOptions.map((service, index) => (
                <option key={index} value={service.value}>
                  {service.display}
                </option>
              ))}
            </select>
            {availableServices.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Showing {availableServices.length} service{availableServices.length !== 1 ? 's' : ''} offered by this clinic
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Date *</label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Time *</label>
            <Input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="Any specific concerns or notes for the doctor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={() => setStep('gcash-payment')}
              disabled={!date || !time || bookingLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {bookingLoading ? (
                <>
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay with GCash'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setStep('clinic-details')}
              disabled={bookingLoading}
            >
              Back
            </Button>
          </div>
          
          {currentPatient && (
            <div className="text-xs text-gray-500 text-center pt-2">
              Booking for: {currentPatient.first_name} {currentPatient.last_name}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentForm = () => {
    if (!selectedClinic || !currentPatient || !date || !time) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">Missing required information for payment.</p>
          <Button 
            onClick={() => setStep('book')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Booking
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Payment - {selectedClinic.clinic_name}</h2>
        <PaymentForm
          clinicId={selectedClinic.id}
          patientId={currentPatient.id}
          appointmentData={{
            consultation_fee: 500.00,
            booking_fee: 100.00,
            total_amount: 600.00
          }}
          onPaymentComplete={(response) => {
            setPaymentResponse(response);
            setStep('confirm');
          }}
          onBack={() => setStep('book')}
        />
      </div>
    );
  };

  const renderGCashPayment = () => {
    if (!selectedClinic || !currentPatient || !date || !time) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">Missing required information for payment.</p>
          <Button 
            onClick={() => setStep('book')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Booking
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">GCash Payment - {selectedClinic.clinic_name}</h2>
        <PayMongoGCashPayment
          amount={600.00}
          description={`Medical consultation at ${selectedClinic.clinic_name}`}
          appointmentId={undefined} // Will be set after appointment creation
          clinicId={selectedClinic.id}
          patientName={`${currentPatient.first_name} ${currentPatient.last_name}`}
          patientEmail={currentPatient.email || ''}
          patientPhone={currentPatient.phone || ''}
          onPaymentSuccess={(paymentIntentId) => {
            setPaymentResponse({
              transaction_number: paymentIntentId,
              status: 'success',
              amount: 600.00,
              instructions: 'Payment completed successfully via GCash'
            });
            setPaymentDone(true);
            setStep('confirm');
          }}
          onPaymentError={(error) => {
            setBookingError(error);
            setPaymentDone(false);
          }}
          onBack={() => setStep('book')}
        />
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Appointment Confirmed!</h2>
        <p className="text-gray-600 mb-4">Your appointment has been successfully booked.</p>
      </div>
      
      {selectedClinic && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Appointment Details:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Clinic:</span> {selectedClinic.clinic_name}</p>
            <p><span className="font-medium">Date:</span> {new Date(date).toLocaleDateString()}</p>
            <p><span className="font-medium">Time:</span> {time}</p>
            <p><span className="font-medium">Type:</span> {appointmentType.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
            {patientNotes && <p><span className="font-medium">Notes:</span> {patientNotes}</p>}
          </div>
        </div>
      )}
      
      {paymentResponse && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 rounded-lg text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Payment Details:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Transaction Number:</span> {paymentResponse.transaction_number}</p>
            <p><span className="font-medium">Status:</span> Payment Successful</p>
            {paymentResponse.instructions && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-xs text-blue-800">{paymentResponse.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2 text-sm text-gray-600 mb-6">
        <p>📧 A confirmation email will be sent to you shortly</p>
        <p>📱 You'll receive SMS reminders before your appointment</p>
        <p>💳 Payment has been processed successfully</p>
      </div>
      
      <div className="flex space-x-3 justify-center">
        <Button onClick={() => {
          setStep('home');
          setDate('');
          setTime('');
          setAppointmentType('consultation');
          setPatientNotes('');
          setPaymentDone(false);
          setBookingError(null);
          setSelectedClinic(null);
          setPaymentResponse(null);
        }} className="bg-blue-600 hover:bg-blue-700">
          Book Another Appointment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('appointments')}
        >
          View My Appointments
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {step === 'home' && renderClinicList()}
      {step === 'clinic-details' && selectedClinic && renderClinicDetails(selectedClinic)}
      {step === 'book' && selectedClinic && renderBookingForm(selectedClinic)}
      {step === 'payment' && renderPaymentForm()}
      {step === 'gcash-payment' && renderGCashPayment()}
      {step === 'confirm' && renderConfirmation()}
      
      {/* Calendar Booking Modal */}
      {showBookingModal && selectedClinic && currentPatient && (
        <AppointmentBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          clinic={{
            id: selectedClinic.id,
            clinic_name: selectedClinic.clinic_name,
            operating_hours: selectedClinic.operating_hours
          }}
          patientId={currentPatient.id}
          onAppointmentBooked={() => {
            setShowBookingModal(false);
            // Optionally refresh clinics or show success message
          }}
        />
      )}

      {/* Clinic Map Modal */}
      {showMapModal && selectedClinicForMap && (
        <ClinicMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedClinicForMap(null);
          }}
          clinic={selectedClinicForMap}
        />
      )}
    </div>
  );

};

export default PatientHome;
