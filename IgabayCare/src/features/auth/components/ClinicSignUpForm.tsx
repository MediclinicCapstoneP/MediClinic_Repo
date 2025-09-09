import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, AlertCircle, CheckCircle, Upload, X, MapPin, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { MapModal } from '../../../components/ui/MapModal';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';

// Tag interface for react-tag-input functionality
interface Tag {
  id: string;
  text: string;
  className?: string;
}

// Medical specialties suggestions
const MEDICAL_SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Psychiatry', 'Internal Medicine', 'Family Medicine', 'Emergency Medicine',
  'Surgery', 'Obstetrics & Gynecology', 'Ophthalmology', 'ENT (Ear, Nose, Throat)',
  'Radiology', 'Anesthesiology', 'Pathology', 'Oncology', 'Endocrinology',
  'Gastroenterology', 'Pulmonology', 'Nephrology', 'Rheumatology',
  'Infectious Disease', 'Physical Medicine'
];

// Medical services suggestions
const MEDICAL_SERVICES = [
  'General Consultation', 'Vaccination', 'Physical Therapy', 'Laboratory Tests',
  'Imaging (X-Ray, MRI, CT)', 'Surgery', 'Emergency Care', 'Preventive Care',
  'Telemedicine', 'Home Care', 'Dental Care', 'Mental Health Services',
  "Women's Health", "Men's Health", 'Pediatric Care', 'Geriatric Care',
  'Chronic Disease Management', 'Pain Management', 'Rehabilitation',
  'Nutrition Counseling', 'Smoking Cessation', 'Weight Management',
  'Travel Medicine', 'Occupational Health'
];

interface ClinicSignUpFormProps {
  onSuccess?: () => void;
}

// Helper component for unpriced services indicator
interface UnpricedServicesIndicatorProps {
  selectedServices: string[];
  servicePricing: any[];
}

const UnpricedServicesIndicator: React.FC<UnpricedServicesIndicatorProps> = ({ 
  selectedServices, 
  servicePricing 
}) => {
  const pricedServices = servicePricing.map((s: any) => s.service_name).filter(Boolean);
  const unpricedServices = selectedServices.filter(service => !pricedServices.includes(service));
  
  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 className="text-sm font-medium text-blue-900 mb-2">Services without pricing:</h5>
      {unpricedServices.length === 0 ? (
        <p className="text-sm text-green-700">
          ✓ All selected services have pricing configured!
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {unpricedServices.map(service => (
            <span key={service} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700">
              {service}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const ClinicSignUpForm: React.FC<ClinicSignUpFormProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const navigate = useNavigate();

  // Tag input states for specialties and services
  const [specialtyTags, setSpecialtyTags] = useState<Tag[]>([]);
  const [serviceTags, setServiceTags] = useState<Tag[]>([]);
  
  // Selected services state for step 5 (service pricing)
  const [selectedServicesForPricing, setSelectedServicesForPricing] = useState<string[]>([]);

  // Service pricing handlers
  const addServicePricing = () => {
    const newService = {
      service_name: '',
      base_price: 0,
      description: '',
      duration_minutes: 30
    };
    
    setFormData((prev: any) => ({
      ...prev,
      service_pricing: [...(prev.service_pricing || []), newService]
    }));
  };

  const updateServicePricing = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      service_pricing: prev.service_pricing?.map((service: any, i: number) => 
        i === index ? { ...service, [field]: value } : service
      ) || []
    }));
  };

  const removeServicePricing = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      service_pricing: prev.service_pricing?.filter((_: any, i: number) => i !== index) || []
    }));
  };

  // Refs to prevent circular updates
  const isUpdatingFromTags = useRef(false);
  const isUpdatingFromForm = useRef(false);

  // Form data with localStorage persistence
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('clinicSignUpData');
    return saved
      ? JSON.parse(saved)
      : {
          clinic_name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          website: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          specialties: [],
          custom_specialties: [],
          services: [],
          custom_services: [],
          license_number: '',
          accreditation: '',
          tax_id: '',
          year_established: '',
          number_of_doctors: '',
          number_of_staff: '',
          description: '',
          operating_hours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' },
          },
          latitude: null,
          longitude: null,
          service_pricing: [],
        };
  });

  // Persist form data and sync with tags
  useEffect(() => {
    if (isUpdatingFromTags.current) {
      isUpdatingFromTags.current = false;
      return;
    }
    
    localStorage.setItem('clinicSignUpData', JSON.stringify(formData));
    
    isUpdatingFromForm.current = true;
    
    const specialtyTagsFromForm = [
      ...formData.specialties.map((spec: string) => ({ id: spec, text: spec, className: 'specialty-standard' })),
      ...formData.custom_specialties.map((spec: string) => ({ id: spec, text: spec, className: 'specialty-custom' }))
    ];
    setSpecialtyTags(specialtyTagsFromForm);
    
    const serviceTagsFromForm = [
      ...formData.services.map((serv: string) => ({ id: serv, text: serv, className: 'service-standard' })),
      ...formData.custom_services.map((serv: string) => ({ id: serv, text: serv, className: 'service-custom' }))
    ];
    setServiceTags(serviceTagsFromForm);
  }, [formData]);

  // Update form data when tags change
  useEffect(() => {
    if (isUpdatingFromForm.current) {
      isUpdatingFromForm.current = false;
      return;
    }
    
    isUpdatingFromTags.current = true;
    
    const standardSpecialties = specialtyTags
      .filter(tag => tag.className === 'specialty-standard' || MEDICAL_SPECIALTIES.includes(tag.text))
      .map(tag => tag.text);
    const customSpecialties = specialtyTags
      .filter(tag => tag.className === 'specialty-custom' || !MEDICAL_SPECIALTIES.includes(tag.text))
      .map(tag => tag.text);
    
    setFormData((prev: any) => ({
      ...prev,
      specialties: standardSpecialties,
      custom_specialties: customSpecialties
    }));
  }, [specialtyTags]);

  useEffect(() => {
    if (isUpdatingFromForm.current) {
      return;
    }
    
    isUpdatingFromTags.current = true;
    
    const standardServices = serviceTags
      .filter(tag => tag.className === 'service-standard' || MEDICAL_SERVICES.includes(tag.text))
      .map(tag => tag.text);
    const customServices = serviceTags
      .filter(tag => tag.className === 'service-custom' || !MEDICAL_SERVICES.includes(tag.text))
      .map(tag => tag.text);
    
    setFormData((prev: any) => ({
      ...prev,
      services: standardServices,
      custom_services: customServices
    }));
    
    // Update selected services for pricing step
    const allServices = [...standardServices, ...customServices];
    setSelectedServicesForPricing(allServices);
  }, [serviceTags]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number, address?: string) => {
    setFormData((prev: any) => ({
      ...prev,
      latitude,
      longitude,
      address: address || prev.address
    }));
    setShowMapModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await roleBasedAuthService.clinic.signUp({
        clinic_name: formData.clinic_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        license_number: formData.license_number || undefined,
        accreditation: formData.accreditation || undefined,
        tax_id: formData.tax_id || undefined,
        year_established: formData.year_established ? parseInt(formData.year_established) : undefined,
        specialties: formData.specialties,
        custom_specialties: formData.custom_specialties,
        services: formData.services,
        custom_services: formData.custom_services,
        operating_hours: formData.operating_hours,
        number_of_doctors: formData.number_of_doctors ? parseInt(formData.number_of_doctors) : undefined,
        number_of_staff: formData.number_of_staff ? parseInt(formData.number_of_staff) : undefined,
        description: formData.description || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
      });

      if (result.success) {
        // If clinic registration successful and service pricing data exists, save it
        if (formData.service_pricing && formData.service_pricing.length > 0 && result.clinic?.id) {
          try {
            const { clinicServicePricingService } = await import('../utils/clinicServicePricingService');
            
            for (const service of formData.service_pricing) {
              if (service.service_name && service.base_price > 0) {
                await clinicServicePricingService.createClinicService(result.clinic.id, {
                  service_name: service.service_name,
                  base_price: service.base_price,
                  description: service.description || '',
                  duration_minutes: service.duration_minutes || 30,
                  service_category: 'consultation',
                  clinic_id: result.clinic.id
                });
              }
            }
          } catch (serviceError) {
            console.error('Error saving service pricing:', serviceError);
            // Don't fail the registration if service pricing fails
          }
        }
        
        setSuccess(true);
        localStorage.removeItem('clinicSignUpData');
        setTimeout(() => {
          navigate('/clinic-signin');
          onSuccess?.();
        }, 3000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFormData = () => {
    localStorage.removeItem('clinicSignUpData');
    setFormData({
      clinic_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      zip_code: '',
      state: '',
      specialties: [],
      custom_specialties: [],
      services: [],
      custom_services: [],
      license_number: '',
      accreditation: '',
      tax_id: '',
      year_established: '',
      number_of_doctors: '',
      number_of_staff: '',
      description: '',
      operating_hours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { open: '10:00', close: '14:00' },
      },
      latitude: null,
      longitude: null,
      service_pricing: [],
    });
    setSpecialtyTags([]);
    setServiceTags([]);
    setCurrentStep(1);
  };

  // Custom TagInput component
  const TagInput: React.FC<{
    tags: Tag[];
    suggestions: string[];
    onAddTag: (tag: Tag) => void;
    onDeleteTag: (index: number) => void;
    placeholder: string;
    className?: string;
  }> = ({ tags, suggestions, onAddTag, onDeleteTag, placeholder, className = '' }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

    useEffect(() => {
      if (inputValue) {
        const filtered = suggestions.filter(suggestion =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, [inputValue, suggestions, tags]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      }
    };

    const addTag = (suggestionText?: string) => {
      const text = suggestionText || inputValue.trim();
      if (text && !tags.some(tag => tag.text.toLowerCase() === text.toLowerCase())) {
        const isStandard = suggestions.includes(text);
        onAddTag({
          id: text,
          text: text,
          className: isStandard ? 'standard' : 'custom'
        });
        setInputValue('');
        setShowSuggestions(false);
      }
    };

    const handleCheckboxChange = (suggestion: string, checked: boolean) => {
      if (checked) {
        addTag(suggestion);
      } else {
        const index = tags.findIndex(tag => tag.text === suggestion);
        if (index !== -1) {
          onDeleteTag(index);
        }
      }
    };

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Checkbox grid for suggestions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {suggestions.map((suggestion) => (
            <label key={suggestion} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={tags.some(tag => tag.text === suggestion)}
                onChange={(e) => handleCheckboxChange(suggestion, e.target.checked)}
                className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">{suggestion}</span>
            </label>
          ))}
        </div>

        {/* Custom input */}
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
          />
          {showSuggestions && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  tag.className === 'custom' || tag.className === 'specialty-custom' || tag.className === 'service-custom'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {tag.text}
                <button
                  type="button"
                  onClick={() => onDeleteTag(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Tag handlers
  const handleAddSpecialtyTag = (tag: Tag) => {
    setSpecialtyTags(prev => [...prev, { ...tag, className: `specialty-${tag.className}` }]);
  };

  const handleDeleteSpecialtyTag = (index: number) => {
    setSpecialtyTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddServiceTag = (tag: Tag) => {
    setServiceTags(prev => [...prev, { ...tag, className: `service-${tag.className}` }]);
  };

  const handleDeleteServiceTag = (index: number) => {
    setServiceTags(prev => prev.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to {formData.email}. Please check your email and click the verification link to complete your clinic registration.
          </p>
          <Button
            onClick={() => roleBasedAuthService.resendVerificationEmail(formData.email)}
            variant="outline"
            className="mr-2"
          >
            Resend Verification Email
          </Button>
          <Button onClick={() => navigate('/clinic-signin')} variant="gradient">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-secondary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Clinic</h1>
            <p className="text-gray-600">Join our healthcare platform and start managing your clinic</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep ? 'bg-secondary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 7 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? 'bg-secondary-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Basic Info</span>
              <span>Contact</span>
              <span>Specialties</span>
              <span>Services</span>
              <span>Pricing</span>
              <span>Business</span>
              <span>Hours</span>
            </div>
          </div>

          <Card className="bg-white shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Step {currentStep} of 7:{' '}
                {currentStep === 1
                  ? 'Basic Information'
                  : currentStep === 2
                  ? 'Contact Information'
                  : currentStep === 3
                  ? 'Medical Specialties'
                  : currentStep === 4
                  ? 'Medical Services'
                  : currentStep === 5
                  ? 'Service Pricing'
                  : currentStep === 6
                  ? 'Business Information'
                  : 'Operating Hours'}
              </h3>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <Input
                      label="Clinic Name"
                      value={formData.clinic_name}
                      onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                      required
                      disabled={isLoading}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isLoading}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="relative">
                        <Input
                          label="Confirm Password"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-red-600 text-sm">Passwords do not match</p>
                      )}
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMapModal(true)}
                        className="w-full flex items-center justify-center space-x-2"
                        disabled={isLoading}
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Select Location on Map</span>
                      </Button>
                      {formData.latitude && formData.longitude && (
                        <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span>Location selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="State"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="ZIP Code"
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Medical Specialties */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Medical Specialties
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Select from the list below or add custom specialties. Selected items will appear as tags.
                      </p>
                      <TagInput
                        tags={specialtyTags}
                        suggestions={MEDICAL_SPECIALTIES}
                        onAddTag={handleAddSpecialtyTag}
                        onDeleteTag={handleDeleteSpecialtyTag}
                        placeholder="Add custom specialty (e.g., Sports Medicine, Geriatrics)"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Medical Services */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Medical Services Offered
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Select from the list below or add custom services. Selected items will appear as tags.
                      </p>
                      <TagInput
                        tags={serviceTags}
                        suggestions={MEDICAL_SERVICES}
                        onAddTag={handleAddServiceTag}
                        onDeleteTag={handleDeleteServiceTag}
                        placeholder="Add custom service (e.g., Acupuncture, Massage Therapy)"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Service Pricing */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Service Pricing</h4>
                          <p className="text-sm text-gray-600">
                            Set prices for your medical services (optional but recommended)
                            {selectedServicesForPricing.length > 0 && (
                              <span className="block text-green-600">
                                ✓ {selectedServicesForPricing.length} service(s) available from Step 4
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={addServicePricing}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          disabled={selectedServicesForPricing.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>

                      {formData.service_pricing && formData.service_pricing.length > 0 ? (
                        <>
                          <div className="space-y-4">
                            {formData.service_pricing.map((service: any, index: number) => (
                              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-gray-900">Service {index + 1}</h5>
                                  <Button
                                    type="button"
                                    onClick={() => removeServicePricing(index)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Service Name
                                    </label>
                                    <select
                                      value={service.service_name}
                                      onChange={(e) => updateServicePricing(index, 'service_name', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-50"
                                      disabled={isLoading}
                                    >
                                      <option value="">Select a service...</option>
                                      {selectedServicesForPricing.map((serviceName) => {
                                        const isAlreadyUsed = formData.service_pricing?.some(
                                          (s: any, i: number) => i !== index && s.service_name === serviceName
                                        );
                                        return (
                                          <option 
                                            key={serviceName} 
                                            value={serviceName}
                                            disabled={isAlreadyUsed}
                                          >
                                            {serviceName} {isAlreadyUsed ? '(Already added)' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    {selectedServicesForPricing.length === 0 && (
                                      <p className="text-xs text-amber-600 mt-1">
                                        No services selected in Step 4. Please go back and select services first.
                                      </p>
                                    )}
                                  </div>
                                  <Input
                                    label="Base Price (₱)"
                                    type="number"
                                    value={service.base_price}
                                    onChange={(e) => updateServicePricing(index, 'base_price', parseFloat(e.target.value) || 0)}
                                    placeholder="500"
                                    disabled={isLoading}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <Input
                                    label="Duration (minutes)"
                                    type="number"
                                    value={service.duration_minutes}
                                    onChange={(e) => updateServicePricing(index, 'duration_minutes', parseInt(e.target.value) || 30)}
                                    placeholder="30"
                                    disabled={isLoading}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Description
                                  </label>
                                  <textarea
                                    value={service.description}
                                    onChange={(e) => updateServicePricing(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-50"
                                    rows={2}
                                    placeholder="Brief description of the service..."
                                    disabled={isLoading}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Show unpriced services */}
                          {selectedServicesForPricing.length > 0 && formData.service_pricing && formData.service_pricing.length > 0 && (
                            <UnpricedServicesIndicator 
                              selectedServices={selectedServicesForPricing}
                              servicePricing={formData.service_pricing}
                            />
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          {selectedServicesForPricing.length > 0 ? (
                            <>
                              <p className="text-gray-600 mb-4">No pricing added yet for your services</p>
                              <Button
                                type="button"
                                onClick={addServicePricing}
                                variant="outline"
                                className="flex items-center mx-auto"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Service Pricing
                              </Button>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-600 mb-4">No services available for pricing</p>
                              <p className="text-sm text-amber-600 mb-4">
                                Please go back to Step 4 and select medical services first.
                              </p>
                              <Button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                variant="outline"
                                className="flex items-center mx-auto"
                              >
                                Go Back to Step 4
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 6: Business Information */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Medical License Number"
                        value={formData.license_number}
                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Accreditation Number"
                        value={formData.accreditation}
                        onChange={(e) => handleInputChange('accreditation', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Tax ID"
                        value={formData.tax_id}
                        onChange={(e) => handleInputChange('tax_id', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Year Established"
                        type="number"
                        value={formData.year_established}
                        onChange={(e) => handleInputChange('year_established', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Number of Doctors"
                        type="number"
                        value={formData.number_of_doctors}
                        onChange={(e) => handleInputChange('number_of_doctors', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Number of Staff"
                        type="number"
                        value={formData.number_of_staff}
                        onChange={(e) => handleInputChange('number_of_staff', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-50"
                        rows={3}
                        placeholder="Describe your clinic's mission, values, and what makes you unique..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Step 7: Operating Hours */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h4>
                      <div className="space-y-4">
                        {Object.entries(formData.operating_hours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex items-center space-x-4">
                            <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                              {day}
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) =>
                                  handleInputChange('operating_hours', {
                                    ...formData.operating_hours,
                                    [day]: { ...hours, open: e.target.value },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                                disabled={isLoading}
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) =>
                                  handleInputChange('operating_hours', {
                                    ...formData.operating_hours,
                                    [day]: { ...hours, close: e.target.value },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Review Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <p>
                          <strong>Clinic Name:</strong> {formData.clinic_name}
                        </p>
                        <p>
                          <strong>Email:</strong> {formData.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {formData.phone || 'Not provided'}
                        </p>
                        <p>
                          <strong>Address:</strong> {formData.address || 'Not provided'}
                        </p>
                        <p>
                          <strong>Specialties:</strong>{' '}
                          {[...formData.specialties, ...formData.custom_specialties].join(', ') || 'None'}
                        </p>
                        <p>
                          <strong>Services:</strong>{' '}
                          {[...formData.services, ...formData.custom_services].join(', ') || 'None'}
                        </p>
                        <p>
                          <strong>License:</strong> {formData.license_number || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <div className="flex space-x-2">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        disabled={isLoading}
                      >
                        Previous
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={clearFormData} disabled={isLoading}>
                      Clear Form Data
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    {currentStep < 7 ? (
                      <Button
                        type="button"
                        variant="gradient"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={isLoading}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" variant="gradient" loading={isLoading}>
                        Complete Registration
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have a clinic account?{' '}
                  <Link
                    to="/clinic-signin"
                    className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map Modal */}
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            onLocationSelect={handleLocationSelect}
            initialLatitude={formData.latitude || 11.049430}
            initialLongitude={formData.longitude || 124.005128}
            title="Select Your Clinic Location"
          />
        </div>
      </div>
    );
  };