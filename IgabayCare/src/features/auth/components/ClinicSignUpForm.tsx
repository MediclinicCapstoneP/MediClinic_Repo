import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Building, MapPin, Phone, Globe, FileText, Clock, Users, CheckCircle, Upload, X, File } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface ClinicSignUpFormProps {
  onSuccess?: () => void;
}

export const ClinicSignUpForm: React.FC<ClinicSignUpFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    // Basic Info
    clinicName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Contact Info
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Business Info
    license: '',
    accreditation: '',
    taxId: '',
    yearEstablished: '',
    
    // Services & Specialties
    specialties: [] as string[],
    services: [] as string[],
    customSpecialties: [] as string[],
    customServices: [] as string[],
    
    // Operating Hours
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true },
    },
    
    // Staff Info
    numberOfDoctors: '',
    numberOfStaff: '',
    
    // Description
    description: '',
    
    // Documents
    documents: {
      license: null as File | null,
      accreditation: null as File | null,
      taxCertificate: null as File | null,
      insuranceCertificate: null as File | null,
      staffCredentials: null as File | null,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [customServiceInput, setCustomServiceInput] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // localStorage keys
  const STORAGE_KEY = 'clinic_signup_form_data';
  const STEP_STORAGE_KEY = 'clinic_signup_current_step';

  // Save form data to localStorage
  const saveFormData = (data: typeof formData) => {
    try {
      // Don't save File objects as they can't be serialized
      const dataToSave = {
        ...data,
        documents: {
          license: null,
          accreditation: null,
          taxCertificate: null,
          insuranceCertificate: null,
          staffCredentials: null,
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  // Load form data from localStorage
  const loadFormData = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  // Save current step to localStorage
  const saveCurrentStep = (step: number) => {
    try {
      localStorage.setItem(STEP_STORAGE_KEY, step.toString());
    } catch (error) {
      console.error('Error saving current step:', error);
    }
  };

  // Load current step from localStorage
  const loadCurrentStep = () => {
    try {
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    } catch (error) {
      console.error('Error loading current step:', error);
    }
  };

  // Clear form data from localStorage
  const clearFormData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  };

  // Load saved data on component mount
  useEffect(() => {
    loadFormData();
    loadCurrentStep();
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    saveFormData(formData);
  }, [formData]);

  // Save current step whenever it changes
  useEffect(() => {
    saveCurrentStep(currentStep);
  }, [currentStep]);

  const specialties = [
    'General Medicine', 'Pediatrics', 'Cardiology', 'Dermatology', 'Orthopedics',
    'Psychiatry', 'Gynecology', 'Neurology', 'Oncology', 'Emergency Medicine',
    'Family Medicine', 'Internal Medicine', 'Surgery', 'Radiology', 'Anesthesiology'
  ];

  const services = [
    'Consultations', 'Check-ups', 'Vaccinations', 'Laboratory Tests', 'Imaging',
    'Minor Procedures', 'Emergency Care', 'Telemedicine', 'Preventive Care',
    'Chronic Disease Management', 'Mental Health Services', 'Physical Therapy'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'specialties' | 'services', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const addCustomSpecialty = () => {
    if (customSpecialtyInput.trim() && !formData.customSpecialties.includes(customSpecialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        customSpecialties: [...prev.customSpecialties, customSpecialtyInput.trim()]
      }));
      setCustomSpecialtyInput('');
    }
  };

  const removeCustomSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      customSpecialties: prev.customSpecialties.filter(item => item !== specialty)
    }));
  };

  const addCustomService = () => {
    if (customServiceInput.trim() && !formData.customServices.includes(customServiceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        customServices: [...prev.customServices, customServiceInput.trim()]
      }));
      setCustomServiceInput('');
    }
  };

  const removeCustomService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter(item => item !== service)
    }));
  };

  const handleOperatingHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = (documentType: keyof typeof formData.documents, file: File) => {
    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PDF, JPG, or PNG files only');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file
      }
    }));
    setError('');
  };

  const removeFile = (documentType: keyof typeof formData.documents) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: null
      }
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.clinicName.trim()) {
          setError('Clinic name is required');
          return false;
        }
        if (!formData.email.trim()) {
          setError('Email is required');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
      case 2:
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (!formData.address.trim()) {
          setError('Address is required');
          return false;
        }
        if (!formData.license.trim()) {
          setError('License number is required');
          return false;
        }
        break;
      case 3:
        if (formData.specialties.length === 0 && formData.customSpecialties.length === 0) {
          setError('Please select at least one specialty');
          return false;
        }
        if (formData.services.length === 0 && formData.customServices.length === 0) {
          setError('Please select at least one service');
          return false;
        }
        break;
      case 4:
        if (!formData.documents.license) {
          setError('Medical license document is required');
          return false;
        }
        if (!formData.documents.accreditation) {
          setError('Accreditation document is required');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual registration logic using Supabase
      // const { data, error } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     data: {
      //       clinic_name: formData.clinicName,
      //       role: 'clinic',
      //       phone: formData.phone,
      //       address: formData.address,
      //       license: formData.license,
      //       specialties: formData.specialties,
      //       services: formData.services,
      //       operating_hours: formData.operatingHours,
      //       description: formData.description,
      //     }
      //   }
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess('Clinic registered successfully! We will review your application and contact you within 24-48 hours.');
      
      // Clear saved form data after successful submission
      clearFormData();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <p className="text-sm text-gray-600 mb-6">Let's start with your clinic's basic details</p>
      </div>
      
      <Input
        type="text"
        label="Clinic Name"
        value={formData.clinicName}
        onChange={(e) => handleInputChange('clinicName', e.target.value)}
        icon={<Building size={20} className="text-gray-400" />}
        required
        placeholder="e.g., City General Hospital"
      />

      <Input
        type="email"
        label="Email Address"
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        icon={<Mail size={20} className="text-gray-400" />}
        required
        placeholder="clinic@example.com"
      />

      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          icon={<Lock size={20} className="text-gray-400" />}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="relative">
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          icon={<Lock size={20} className="text-gray-400" />}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-4 w-4 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
            At least 8 characters
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-4 w-4 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
            One uppercase letter
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-4 w-4 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
            One number
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Business Information</h3>
        <p className="text-sm text-gray-600 mb-6">Provide your clinic's contact details and business information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="tel"
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          icon={<Phone size={20} className="text-gray-400" />}
          required
          placeholder="+1 234-567-8900"
        />

        <Input
          type="url"
          label="Website (Optional)"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          icon={<Globe size={20} className="text-gray-400" />}
          placeholder="https://www.clinic.com"
        />
      </div>

      <Input
        type="text"
        label="Street Address"
        value={formData.address}
        onChange={(e) => handleInputChange('address', e.target.value)}
        icon={<MapPin size={20} className="text-gray-400" />}
        required
        placeholder="123 Main Street"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          label="City"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          required
          placeholder="New York"
        />

        <Input
          type="text"
          label="ZIP Code"
          value={formData.zipCode}
          onChange={(e) => handleInputChange('zipCode', e.target.value)}
          required
          placeholder="10001"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="text"
          label="Medical License Number"
          value={formData.license}
          onChange={(e) => handleInputChange('license', e.target.value)}
          icon={<FileText size={20} className="text-gray-400" />}
          required
          placeholder="MED-12345-2024"
        />

        <Input
          type="text"
          label="Accreditation Number (Optional)"
          value={formData.accreditation}
          onChange={(e) => handleInputChange('accreditation', e.target.value)}
          icon={<FileText size={20} className="text-gray-400" />}
          placeholder="ACC-98765-2024"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="text"
          label="Tax ID (Optional)"
          value={formData.taxId}
          onChange={(e) => handleInputChange('taxId', e.target.value)}
          placeholder="12-3456789"
        />

        <Input
          type="number"
          label="Year Established"
          value={formData.yearEstablished}
          onChange={(e) => handleInputChange('yearEstablished', e.target.value)}
          placeholder="2020"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Specialties</h3>
        <p className="text-sm text-gray-600 mb-6">Select the medical specialties and services your clinic offers</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Medical Specialties</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {specialties.map((specialty) => (
            <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.specialties.includes(specialty)}
                onChange={() => handleArrayChange('specialties', specialty)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{specialty}</span>
            </label>
          ))}
        </div>

        {/* Custom Specialties */}
        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customSpecialtyInput}
              onChange={(e) => setCustomSpecialtyInput(e.target.value)}
              placeholder="Add custom specialty..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecialty())}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomSpecialty}
              disabled={!customSpecialtyInput.trim()}
            >
              Add
            </Button>
          </div>

          {/* Display Custom Specialties */}
          {formData.customSpecialties.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Custom Specialties:</p>
              <div className="flex flex-wrap gap-2">
                {formData.customSpecialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{specialty}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomSpecialty(specialty)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Services Offered</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {services.map((service) => (
            <label key={service} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={() => handleArrayChange('services', service)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{service}</span>
            </label>
          ))}
        </div>

        {/* Custom Services */}
        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customServiceInput}
              onChange={(e) => setCustomServiceInput(e.target.value)}
              placeholder="Add custom service..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomService}
              disabled={!customServiceInput.trim()}
            >
              Add
            </Button>
          </div>

          {/* Display Custom Services */}
          {formData.customServices.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Custom Services:</p>
              <div className="flex flex-wrap gap-2">
                {formData.customServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomService(service)}
                      className="text-secondary-600 hover:text-secondary-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Operating Hours</label>
        <div className="space-y-3">
          {Object.entries(formData.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium text-gray-700 capitalize">
                {day}
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Open</span>
              </label>
              {!hours.closed && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Number of Doctors"
          value={formData.numberOfDoctors}
          onChange={(e) => handleInputChange('numberOfDoctors', e.target.value)}
          icon={<Users size={20} className="text-gray-400" />}
          placeholder="5"
        />

        <Input
          type="number"
          label="Number of Staff"
          value={formData.numberOfStaff}
          onChange={(e) => handleInputChange('numberOfStaff', e.target.value)}
          icon={<Users size={20} className="text-gray-400" />}
          placeholder="15"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
        <p className="text-sm text-gray-600 mb-6">Upload your clinic's official documents for verification</p>
      </div>

      <div className="space-y-6">
        {/* Medical License */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical License Document <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {formData.documents.license ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.documents.license.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(formData.documents.license.size)}</p>
                <button
                  type="button"
                  onClick={() => removeFile('license')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG (max 5MB)</p>
                <input
                  ref={(el) => fileInputRefs.current.license = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('license', e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current.license?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Accreditation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accreditation Certificate <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {formData.documents.accreditation ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.documents.accreditation.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(formData.documents.accreditation.size)}</p>
                <button
                  type="button"
                  onClick={() => removeFile('accreditation')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG (max 5MB)</p>
                <input
                  ref={(el) => fileInputRefs.current.accreditation = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('accreditation', e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current.accreditation?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tax Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Certificate (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {formData.documents.taxCertificate ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.documents.taxCertificate.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(formData.documents.taxCertificate.size)}</p>
                <button
                  type="button"
                  onClick={() => removeFile('taxCertificate')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG (max 5MB)</p>
                <input
                  ref={(el) => fileInputRefs.current.taxCertificate = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('taxCertificate', e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current.taxCertificate?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Insurance Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Insurance Certificate (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {formData.documents.insuranceCertificate ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.documents.insuranceCertificate.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(formData.documents.insuranceCertificate.size)}</p>
                <button
                  type="button"
                  onClick={() => removeFile('insuranceCertificate')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG (max 5MB)</p>
                <input
                  ref={(el) => fileInputRefs.current.insuranceCertificate = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('insuranceCertificate', e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current.insuranceCertificate?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Staff Credentials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Credentials Summary (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {formData.documents.staffCredentials ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.documents.staffCredentials.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(formData.documents.staffCredentials.size)}</p>
                <button
                  type="button"
                  onClick={() => removeFile('staffCredentials')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG (max 5MB)</p>
                <input
                  ref={(el) => fileInputRefs.current.staffCredentials = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('staffCredentials', e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current.staffCredentials?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Document Requirements</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• All documents must be in PDF, JPG, or PNG format</p>
          <p>• Maximum file size: 5MB per document</p>
          <p>• Medical License and Accreditation are required</p>
          <p>• Other documents are optional but recommended</p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Description</h3>
        <p className="text-sm text-gray-600 mb-6">Tell patients about your clinic</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinic Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Describe your clinic's mission, values, and what makes you unique..."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Review Your Information</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Clinic Name: {formData.clinicName}</p>
          <p>• Email: {formData.email}</p>
          <p>• Phone: {formData.phone}</p>
          <p>• Address: {formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
          <p>• Specialties: {[...formData.specialties, ...formData.customSpecialties].join(', ')}</p>
          <p>• Services: {[...formData.services, ...formData.customServices].join(', ')}</p>
          <p>• Documents: {Object.values(formData.documents).filter(Boolean).length} uploaded</p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input 
          type="checkbox" 
          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
          required
        />
        <label className="text-sm text-gray-600">
          I agree to the{' '}
          <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
            Privacy Policy
          </button>
        </label>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 to-secondary-50/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-primary-100">
        <div className="text-center mb-8">
          <div className="mx-auto p-3 bg-gradient-medical rounded-2xl w-fit mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Register Your Clinic</h1>
          <p className="text-muted-foreground">Join iGabayAtiCare and grow your practice</p>
          
          {/* Clear Form Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
                  clearFormData();
                  setFormData({
                    clinicName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    website: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    license: '',
                    accreditation: '',
                    taxId: '',
                    yearEstablished: '',
                                         specialties: [],
                     services: [],
                     customSpecialties: [],
                     customServices: [],
                    operatingHours: {
                      monday: { open: '08:00', close: '17:00', closed: false },
                      tuesday: { open: '08:00', close: '17:00', closed: false },
                      wednesday: { open: '08:00', close: '17:00', closed: false },
                      thursday: { open: '08:00', close: '17:00', closed: false },
                      friday: { open: '08:00', close: '17:00', closed: false },
                      saturday: { open: '09:00', close: '15:00', closed: false },
                      sunday: { open: '10:00', close: '14:00', closed: true },
                    },
                    numberOfDoctors: '',
                    numberOfStaff: '',
                    description: '',
                    documents: {
                      license: null,
                      accreditation: null,
                      taxCertificate: null,
                      insuranceCertificate: null,
                      staffCredentials: null,
                    },
                  });
                  setCurrentStep(1);
                  setError('');
                  setSuccess('');
                }
              }}
              className="text-xs"
            >
              Clear Form Data
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Basic Info</span>
            <span>Contact</span>
            <span>Services</span>
            <span>Documents</span>
            <span>Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                loading={loading}
              >
                Register Clinic
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              type="button" 
              className="text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => window.location.href = '/signin'}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}; 