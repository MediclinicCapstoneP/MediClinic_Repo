import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, History, Heart, TrendingUp, Clock, Star, Users, Activity, Award, Shield, Phone, Mail, ExternalLink, X } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { patientService } from '../../features/auth/utils/patientService';
import { authService } from '../../features/auth/utils/authService';
import { SkeletonCard } from '../../components/ui/Skeleton';
import type { CreateAppointmentData, AppointmentType } from '../../types/appointments';

// Default clinic image for clinics without uploaded images
const DEFAULT_CLINIC_IMAGE = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400';

interface PatientHomeProps {
  onNavigate: (tab: string) => void;
}

type Step = 'home' | 'clinic-details' | 'book' | 'confirm';

interface PatientData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const PatientHome: React.FC<PatientHomeProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<Step>('home');
  const [selectedClinic, setSelectedClinic] = useState<ClinicProfile | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);

  const stats = [
    {
      title: 'Total Visits',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Upcoming',
      value: '2',
      change: 'This week',
      changeType: 'neutral',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Clinics Visited',
      value: '4',
      change: 'This year',
      changeType: 'neutral',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];




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
        
        const result = await clinicService.getPublicClinics();
        
        if (result.success && result.clinics) {
          setClinics(result.clinics);
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
  }, []);

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

  const filteredClinics = clinics.filter(clinic => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      clinic.clinic_name.toLowerCase().includes(searchLower) ||
      (clinic.address && clinic.address.toLowerCase().includes(searchLower)) ||
      (clinic.city && clinic.city.toLowerCase().includes(searchLower)) ||
      (clinic.description && clinic.description.toLowerCase().includes(searchLower)) ||
      (clinic.specialties && clinic.specialties.some(s => s.toLowerCase().includes(searchLower))) ||
      (clinic.custom_specialties && clinic.custom_specialties.some(s => s.toLowerCase().includes(searchLower)))
    );
  });

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
        priority: 'normal',
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
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Search clinics, specialties, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-gray-500'}`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Available Clinics</h2>
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
            {searchTerm ? 'No Clinics Match Your Search' : 'No Clinics Available'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria or clearing the search to see all clinics.' 
              : 'No approved clinics are currently available for booking.'}
          </p>
          {searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="mb-4"
            >
              Clear search
            </Button>
          )}
          {!searchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-md">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">🔧 Troubleshooting Tips:</p>
                <div className="text-left space-y-1">
                  <p>• Check browser console (F12) for error messages</p>
                  <p>• Verify Supabase database connection</p>
                  <p>• Ensure clinics exist with 'approved' status</p>
                  <p>• Contact administrator if problem persists</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map(clinic => (
            <div
              key={clinic.id}
              className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              onClick={() => handleClinicClick(clinic.id)}
            >
              <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 hover:border-blue-200">
                {/* Clinic Image */}
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={clinic.profile_pic_url || DEFAULT_CLINIC_IMAGE} 
                    alt={clinic.clinic_name} 
                    className="w-full h-full object-cover transition-transform hover:scale-110"
                    onError={(e) => {
                      // Fallback to default image if profile picture fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_CLINIC_IMAGE;
                    }}
                  />
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getStatusColor(clinic.status)}`}>
                      {clinic.status === 'approved' ? '✓ Verified' : clinic.status}
                    </span>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  {/* Clinic Name */}
                  <div className="mb-3">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 mb-1">
                      {clinic.clinic_name || 'Medical Clinic'}
                    </h3>
                    {clinic.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {clinic.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {/* Address */}
                    {formatAddress(clinic) && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span className="line-clamp-2">{formatAddress(clinic)}</span>
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
                  
                  {/* Specialties */}
                  <div className="mb-4">
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
                    </div>
                    {/* Show fallback if no specialties */}
                    {(!clinic.specialties || clinic.specialties.length === 0) && 
                     (!clinic.custom_specialties || clinic.custom_specialties.length === 0) && (
                      <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                        General Medicine
                      </span>
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
                  
                  {/* Action Button */}
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Details & Book Appointment
                  </Button>
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
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                    <span>{formatAddress(clinic)}</span>
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
            onClick={() => setStep('book')} 
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
    
    // Convert service name to valid AppointmentType format
    const convertToAppointmentType = (serviceName: string): AppointmentType => {
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
    };
    
    // If no services are defined, fall back to default appointment types with display names
    const defaultServices = [
      { display: 'Consultation', value: 'consultation' },
      { display: 'Routine Checkup', value: 'routine_checkup' },
      { display: 'Follow-up', value: 'follow_up' },
      { display: 'Emergency', value: 'emergency' },
      { display: 'Specialist Visit', value: 'specialist_visit' },
      { display: 'Vaccination', value: 'vaccination' },
      { display: 'Other', value: 'other' }
    ];
    
    const serviceOptions = availableServices.length > 0 
      ? availableServices.map(service => ({
          display: service,
          value: convertToAppointmentType(service)
        }))
      : defaultServices;
    
    // Reset appointment type if current selection is not available for this clinic
    React.useEffect(() => {
      if (serviceOptions.length > 0) {
        const currentServiceExists = serviceOptions.some(option => option.value === appointmentType);
        if (!currentServiceExists) {
          const firstValidType = serviceOptions[0].value as AppointmentType;
          setAppointmentType(firstValidType);
        }
      }
    }, [clinic.id]);

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
          
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <div className="flex justify-between text-sm">
                <span>Consultation Fee:</span>
                <span className="font-medium">₱500.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Booking Fee:</span>
                <span className="font-medium">₱100.00</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>₱600.00</span>
              </div>
            </div>
            <Button 
              onClick={() => setPaymentDone(true)} 
              disabled={paymentDone}
              className={`w-full ${paymentDone ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {paymentDone ? '✔ Payment Completed' : 'Pay Now'}
            </Button>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleBookAppointment}
              disabled={!date || !time || !paymentDone || bookingLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {bookingLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                'Confirm Booking'
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
      
      <div className="space-y-2 text-sm text-gray-600 mb-6">
        <p>📧 A confirmation email will be sent to you shortly</p>
        <p>📱 You'll receive SMS reminders before your appointment</p>
        <p>💳 Payment of ₱600.00 has been processed</p>
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
      {step === 'confirm' && renderConfirmation()}
    </div>
  );
};

export default PatientHome;
