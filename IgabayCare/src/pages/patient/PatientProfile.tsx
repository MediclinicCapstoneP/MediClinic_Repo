import React, { useState, useEffect } from 'react';
import { User, Calendar, Phone, Mail, MapPin, Heart, Pill, AlertTriangle, Save, Trash2, Edit, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ProfilePicture } from '../../components/ui/ProfilePicture';
import { authService } from '../../features/auth/utils/authService';
import { patientService, type PatientProfile } from '../../features/auth/utils/patientService';

export const PatientProfileComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'settings'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<PatientProfile>({
    id: '',
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: null,
    address: '',
    emergency_contact: '',
    blood_type: '',
    allergies: '',
    medications: '',
    medical_conditions: '',
    profile_pic_url: null,
    created_at: '',
    updated_at: '',
  });

  const [originalData, setOriginalData] = useState<PatientProfile | null>(null);

  // Fetch patient data from Supabase
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          setError('No authenticated user found');
          return;
        }

        const patientResult = await patientService.getPatientByUserId(currentUser.id);
        if (patientResult.success && patientResult.patient) {
          // Convert null values to empty strings for React inputs
          const sanitizedPatient = {
            ...patientResult.patient,
            phone: patientResult.patient.phone || '',
            address: patientResult.patient.address || '',
            emergency_contact: patientResult.patient.emergency_contact || '',
            blood_type: patientResult.patient.blood_type || '',
            allergies: patientResult.patient.allergies || '',
            medications: patientResult.patient.medications || '',
            medical_conditions: patientResult.patient.medical_conditions || '',
            profile_pic_url: patientResult.patient.profile_pic_url || '',
          };
          setPatientData(sanitizedPatient);
          setOriginalData(sanitizedPatient);
        } else {
          setError(patientResult.error || 'Patient profile not found');
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, []); 

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setError(null);
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Sanitize data for database
      const sanitizedData = sanitizeDataForDatabase(patientData);
      const updatedData = await patientService.updatePatient(patientData.user_id, sanitizedData);
      
      if (updatedData.success && updatedData.patient) {
        setPatientData(updatedData.patient);
        setOriginalData(updatedData.patient);
        setIsEditing(false);
      } else {
        throw new Error(updatedData.error || 'Failed to update patient profile');
      }
    } catch (err) {
      console.error('Error saving patient profile:', err);
      setError('Failed to save patient profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setPatientData(originalData);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureUpdate = (url: string) => {
    setPatientData(prev => ({
      ...prev,
      profile_pic_url: url,
    }));
  };

  const handleProfilePictureDelete = () => {
    setPatientData(prev => ({
      ...prev,
      profile_pic_url: url,
    }));
  };

  // Helper function to sanitize data for database
  const sanitizeDataForDatabase = (data: PatientProfile) => {
    return {
      ...data,
      phone: data.phone || undefined,
      address: data.address || undefined,
      emergency_contact: data.emergency_contact || undefined,
      blood_type: data.blood_type || undefined,
      allergies: data.allergies || undefined,
      medications: data.medications || undefined,
      medical_conditions: data.medical_conditions || undefined,
      profile_pic_url: data.profile_pic_url || undefined,
    };
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const deleteResult = await patientService.deletePatient(patientData.id);
      if (deleteResult.success) {
        await authService.signOut();
        window.location.href = '/';
      } else {
        throw new Error(deleteResult.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading patient profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Profile</h1>
          <p className="text-gray-600">Manage your personal and medical information</p>
        </div>
        <div className="flex space-x-2">
          {isEditing && (
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            variant={isEditing ? "gradient" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            loading={isSaving}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit size={16} className="mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardContent className="p-6 text-center">
              <ProfilePicture
                currentImageUrl={patientData.profile_pic_url || undefined}
                userId={patientData.user_id}
                userType="patient"
                size="xl"
                onImageUpdate={handleProfilePictureUpdate}
                onImageDelete={handleProfilePictureDelete}  
                disabled={!isEditing}
                className="mx-auto"
              />
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                {patientData.first_name} {patientData.last_name}
              </h3>
              <p className="text-gray-600">{patientData.email}</p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Type</span>
                  <span className="font-medium">{patientData.blood_type || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allergies</span>
                  <span className="font-medium">{patientData.allergies || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Medications</span>
                  <span className="font-medium">{patientData.medications || 'None'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <Card>
            <CardContent className="p-0">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'personal'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User size={16} className="mr-2 inline" />
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'medical'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Heart size={16} className="mr-2 inline" />
                  Medical Info
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <AlertTriangle size={16} className="mr-2 inline" />
                  Settings
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          {activeTab === 'personal' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={patientData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    value={patientData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={patientData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Phone Number"
                    value={patientData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <Input
                  label="Date of Birth"
                  type="date"
                  value={patientData.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={!isEditing}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={patientData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={2}
                  />
                </div>

                <Input
                  label="Emergency Contact"
                  value={patientData.emergency_contact || ''}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'medical' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Input
                  label="Blood Type"
                  value={patientData.blood_type || ''}
                  onChange={(e) => handleInputChange('blood_type', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., O+, A-, B+, AB-"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <textarea
                    value={patientData.allergies || ''}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={2}
                    placeholder="List any allergies (e.g., Penicillin, Peanuts, Latex)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                  <textarea
                    value={patientData.medications || ''}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="List current medications with dosages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                  <textarea
                    value={patientData.medical_conditions || ''}
                    onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="List any chronic conditions or medical history"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Danger Zone</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDeleteAccount}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};