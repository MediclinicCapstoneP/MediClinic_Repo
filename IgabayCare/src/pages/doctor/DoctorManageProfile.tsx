import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { doctorDashboardService } from '../../features/auth/utils/doctorDashboardService';
import { 
  User, Edit, Save, X, Camera, Mail, Phone, MapPin, Calendar,
  Stethoscope, GraduationCap, Award, Clock, Shield, Eye, EyeOff,
  AlertTriangle, CheckCircle, Settings, Bell, Lock, Globe,
  Building, FileText, Users, Activity, RefreshCw
} from 'lucide-react';

interface DoctorManageProfileProps {
  doctorId: string;
  onProfileUpdate?: () => void;
}

interface DoctorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  profile_pic_url?: string;
  specialization?: string;
  years_of_experience?: number;
  license_number?: string;
  qualifications?: string;
  bio?: string;
  clinic_address?: string;
  consultation_fee?: number;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  totalAppointments: number;
  totalPatients: number;
  completedAppointments: number;
  activePrescriptions: number;
  joinedDate: string;
  lastActiveDate: string;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const DoctorManageProfile: React.FC<DoctorManageProfileProps> = ({ 
  doctorId,
  onProfileUpdate
}) => {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'professional' | 'settings'>('profile');

  useEffect(() => {
    if (doctorId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  const loadProfile = async () => {
    if (!doctorId || doctorId === '') {
      console.warn('No doctorId provided to loadProfile');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load doctor profile
      const profileResult = await doctorDashboardService.getDoctorProfile(doctorId);
      if (profileResult.success && profileResult.profile) {
        setProfile(profileResult.profile);
        setEditedProfile({ ...profileResult.profile });
        
        // Load profile statistics
        await loadProfileStats(profileResult.profile);
      } else {
        console.error('Error loading profile:', profileResult.error);
        // Set validation error so user knows what went wrong
        setValidationErrors({ 
          load: profileResult.error || 'Failed to load doctor profile' 
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors({ 
        load: 'An unexpected error occurred while loading profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfileStats = async (doctorProfile: DoctorProfile) => {
    try {
      // Get appointments to calculate stats
      const appointmentsResult = await doctorDashboardService.getDoctorAppointments(doctorProfile.id);
      
      if (appointmentsResult.success && appointmentsResult.appointments) {
        const appointments = appointmentsResult.appointments;
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
        
        // Count unique patients
        const uniquePatientIds = new Set(
          appointments.map(apt => apt.patient_id).filter(id => id !== null)
        );
        const totalPatients = uniquePatientIds.size;

        // Find last appointment date for activity
        const sortedAppointments = appointments
          .map(apt => new Date(apt.appointment_date))
          .sort((a, b) => b.getTime() - a.getTime());
        const lastActiveDate = sortedAppointments.length > 0 
          ? sortedAppointments[0].toISOString()
          : doctorProfile.created_at;

        setStats({
          totalAppointments,
          totalPatients,
          completedAppointments,
          activePrescriptions: 0, // Would need prescription service call
          joinedDate: doctorProfile.created_at,
          lastActiveDate
        });
      }
    } catch (error) {
      console.warn('Error loading profile stats:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProfile(profile ? { ...profile } : null);
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof DoctorProfile, value: string | number) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
      
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors({
          ...validationErrors,
          [field]: ''
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!editedProfile) return false;

    if (!editedProfile.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!editedProfile.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!editedProfile.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (editedProfile.phone && !/^\+?[\d\s\-\(\)]+$/.test(editedProfile.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (editedProfile.consultation_fee && editedProfile.consultation_fee < 0) {
      errors.consultation_fee = 'Consultation fee cannot be negative';
    }

    if (editedProfile.years_of_experience && editedProfile.years_of_experience < 0) {
      errors.years_of_experience = 'Years of experience cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editedProfile || !validateForm()) {
      return;
    }

    // Check if doctorId is valid
    if (!doctorId || doctorId === '') {
      console.error('No valid doctorId provided for profile update');
      setValidationErrors({ submit: 'Unable to update profile: Doctor ID not found' });
      return;
    }

    try {
      setSaving(true);
      
      // Use doctorId from props instead of editedProfile.id to ensure we have the correct ID
      const updateResult = await doctorDashboardService.updateDoctorProfile(doctorId, editedProfile);
      
      if (updateResult.success) {
        setProfile(editedProfile);
        setIsEditing(false);
        setValidationErrors({});
        
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        console.error('Error updating profile:', updateResult.error);
        setValidationErrors({ 
          submit: `Failed to update profile: ${updateResult.error}` 
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setValidationErrors({ 
        submit: 'An unexpected error occurred while saving. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const errors: { [key: string]: string } = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      try {
        setSaving(true);
        // Here you would call your password change service
        // await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setValidationErrors({});
      } catch (error) {
        console.error('Error changing password:', error);
        setValidationErrors({ submit: 'Failed to change password. Please try again.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width={200} height={32} />
          <div className="flex gap-2">
            <Skeleton width={100} height={40} />
            <Skeleton width={120} height={40} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton width="100%" height={300} />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardContent className="p-6">
                <Skeleton width="100%" height={200} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!doctorId || doctorId === '' || !profile) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage Profile</h2>
        </div>
        
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600">
            Unable to load your profile. Please try refreshing the page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Profile</h2>
          <p className="text-gray-600 mt-1">Update your professional information and settings</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadProfile} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleEditToggle} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Personal Info', icon: User },
            { id: 'professional', label: 'Professional', icon: Stethoscope },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    {/* Profile Picture */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {profile.profile_pic_url ? (
                          <img 
                            src={profile.profile_pic_url} 
                            alt={`${profile.first_name} ${profile.last_name}`}
                            className="w-24 h-24 object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-blue-600" />
                        )}
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                          <Camera className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          {isEditing ? (
                            <div>
                              <Input
                                value={editedProfile?.first_name || ''}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                className={validationErrors.first_name ? 'border-red-500' : ''}
                              />
                              {validationErrors.first_name && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-900">{profile.first_name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          {isEditing ? (
                            <div>
                              <Input
                                value={editedProfile?.last_name || ''}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                className={validationErrors.last_name ? 'border-red-500' : ''}
                              />
                              {validationErrors.last_name && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-900">{profile.last_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Contact Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        {isEditing ? (
                          <div>
                            <Input
                              type="email"
                              value={editedProfile?.email || ''}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={validationErrors.email ? 'border-red-500' : ''}
                            />
                            {validationErrors.email && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <p className="text-gray-900">{profile.email}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        {isEditing ? (
                          <div>
                            <Input
                              value={editedProfile?.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className={validationErrors.phone ? 'border-red-500' : ''}
                            />
                            {validationErrors.phone && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-900">{profile.address || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Personal Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedProfile?.date_of_birth || ''}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <p className="text-gray-900">
                              {profile.date_of_birth 
                                ? `${formatDate(profile.date_of_birth)} (Age ${calculateAge(profile.date_of_birth)})`
                                : 'Not provided'
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        {isEditing ? (
                          <select
                            value={editedProfile?.gender || ''}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.specialization || ''}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-900">{profile.specialization || 'Not specified'}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      {isEditing ? (
                        <div>
                          <Input
                            type="number"
                            min="0"
                            value={editedProfile?.years_of_experience || ''}
                            onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value))}
                            className={validationErrors.years_of_experience ? 'border-red-500' : ''}
                          />
                          {validationErrors.years_of_experience && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.years_of_experience}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-900">{profile.years_of_experience || 0} years</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.license_number || ''}
                          onChange={(e) => handleInputChange('license_number', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-900">{profile.license_number || 'Not provided'}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consultation Fee
                      </label>
                      {isEditing ? (
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editedProfile?.consultation_fee || ''}
                            onChange={(e) => handleInputChange('consultation_fee', parseFloat(e.target.value))}
                            className={validationErrors.consultation_fee ? 'border-red-500' : ''}
                          />
                          {validationErrors.consultation_fee && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.consultation_fee}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {profile.consultation_fee ? `$${profile.consultation_fee}` : 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualifications
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={editedProfile?.qualifications || ''}
                        onChange={(e) => handleInputChange('qualifications', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="List your qualifications, degrees, and certifications..."
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500 mt-1" />
                        <p className="text-gray-900">{profile.qualifications || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Address
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={editedProfile?.clinic_address || ''}
                        onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your clinic address..."
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-gray-500 mt-1" />
                        <p className="text-gray-900">{profile.clinic_address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editedProfile?.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Write a brief bio about yourself and your practice..."
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 mt-1" />
                        <p className="text-gray-900">{profile.bio || 'No bio provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Account Security</h4>
                    
                    <Card className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Password</p>
                            <p className="text-sm text-gray-600">Change your account password</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setShowPasswordModal(true)}
                          variant="outline"
                          size="sm"
                        >
                          Change Password
                        </Button>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Account Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Account Created</p>
                        <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Last Updated</p>
                        <p className="text-gray-900">{formatDate(profile.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  {profile.profile_pic_url ? (
                    <img 
                      src={profile.profile_pic_url} 
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">
                  Dr. {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-sm text-gray-600">{profile.specialization || 'Medical Doctor'}</p>
              </div>

              {stats && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Patients</span>
                    <span className="font-medium text-gray-900">{stats.totalPatients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Appointments</span>
                    <span className="font-medium text-gray-900">{stats.totalAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-gray-900">{stats.completedAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="font-medium text-gray-900">{profile.years_of_experience || 0} years</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={loadProfile}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value
                })}
                className={validationErrors.currentPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value
              })}
              className={validationErrors.newPassword ? 'border-red-500' : ''}
            />
            {validationErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value
              })}
              className={validationErrors.confirmPassword ? 'border-red-500' : ''}
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {validationErrors.submit && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-red-700 text-sm">{validationErrors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              onClick={() => setShowPasswordModal(false)} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordChange}
              disabled={saving}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};