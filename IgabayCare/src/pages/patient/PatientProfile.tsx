import React, { useState, useEffect } from 'react';
import { User, Camera, Save, Edit, Phone, Mail, MapPin, Calendar, Eye, EyeOff, Lock, Shield, Bell, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

export const PatientProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 234-567-8900',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, Downtown, City 12345',
    emergencyContact: 'Jane Doe - +1 234-567-8901',
    bloodType: 'O+',
    allergies: 'None',
    medications: 'None',
    medicalConditions: 'None',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    healthUpdates: true,
  });

  const [stats, setStats] = useState({
    totalAppointments: 12,
    thisYear: 3,
    upcoming: 2,
    completed: 10,
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Error saving profile:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // TODO: Reset to original data
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingToggle = (setting: string) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    setShowDeleteModal(false);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your personal information and medical details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                  <User size={48} className="text-primary-600" />
                </div>
                <button 
                  className="absolute bottom-2 right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors shadow-lg"
                  disabled={!isEditing}
                >
                  <Camera size={16} />
                </button>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <p className="text-gray-600 mb-3">{profileData.email}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <Phone size={16} />
                  <span>{profileData.phone}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Calendar size={16} />
                  <span>{calculateAge(profileData.dateOfBirth)} years old</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <MapPin size={16} />
                  <span className="truncate max-w-48">{profileData.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Health Overview</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</div>
                    <div className="text-sm text-gray-600">Total Visits</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.thisYear}</div>
                    <div className="text-sm text-gray-600">This Year</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.upcoming}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{profileData.bloodType}</div>
                    <div className="text-sm text-gray-600">Blood Type</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-red-600" />
                  <span className="text-sm font-medium">{profileData.emergencyContact}</span>
                </div>
                <p className="text-xs text-gray-600">This contact will be notified in case of emergency</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <div className="flex space-x-2">
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant={isEditing ? "gradient" : "outline"}
                    size="sm"
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
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  icon={<Mail size={16} className="text-gray-400" />}
                />
                <Input
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  icon={<Phone size={16} className="text-gray-400" />}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                  icon={<Calendar size={16} className="text-gray-400" />}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    value={profileData.bloodType}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  >
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <Input
                  label="Emergency Contact"
                  value={profileData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Name - Phone Number"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  rows={2}
                  placeholder="Enter your full address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <textarea
                    value={profileData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="List any allergies or write 'None'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                  <textarea
                    value={profileData.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="List current medications or write 'None'"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                <textarea
                  value={profileData.medicalConditions}
                  onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  rows={3}
                  placeholder="List any medical conditions or write 'None'"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive appointment reminders and updates</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      settings.emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    onClick={() => handleSettingToggle('emailNotifications')}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full absolute top-0.5 transition-transform ${
                      settings.emailNotifications ? 'right-0.5' : 'left-0.5'
                    }`}></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone size={20} className="text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Receive text message reminders</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      settings.smsNotifications ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    onClick={() => handleSettingToggle('smsNotifications')}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full absolute top-0.5 transition-transform ${
                      settings.smsNotifications ? 'right-0.5' : 'left-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Appointment Reminders</h4>
                      <p className="text-sm text-gray-600">Get notified before your appointments</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      settings.appointmentReminders ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    onClick={() => handleSettingToggle('appointmentReminders')}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full absolute top-0.5 transition-transform ${
                      settings.appointmentReminders ? 'right-0.5' : 'left-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button 
                    variant="danger" 
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                className="flex-1"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};