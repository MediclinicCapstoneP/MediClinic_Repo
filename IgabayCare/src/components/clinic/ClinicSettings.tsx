import React, { useState } from 'react';
import { Save, Camera, Clock, DollarSign, Shield, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';

export const ClinicSettings: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [clinicData, setClinicData] = useState({
    clinicName: 'City General Hospital',
    address: '123 Main Street, Downtown, City 12345',
    phone: '+1 234-567-8900',
    email: 'info@citygeneralhospital.com',
    website: 'www.citygeneralhospital.com',
    license: 'MED-12345-2024',
    accreditation: 'ACC-98765-2024',
    description: 'A modern healthcare facility providing comprehensive medical services to the community.',
    services: ['General Medicine', 'Emergency Care', 'Preventive Care', 'Laboratory Services'],
    operatingHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: '10:00', close: '14:00' },
    },
    paymentBeforeBooking: true,
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmation: true,
    autoValidation: true,
  });

  const handleSave = () => {
    // TODO: Save to Supabase
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setClinicData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatingHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setClinicData(prev => ({
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

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Settings</h1>
          <p className="text-gray-600">Manage your clinic's information and preferences</p>
        </div>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save size={16} className="mr-2" />
              Save Changes
            </>
          ) : (
            'Edit Settings'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Clinic Logo */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Clinic Logo</p>
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera size={16} />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{clinicData.clinicName}</h3>
              <p className="text-gray-600">{clinicData.email}</p>
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
                  <span className="text-gray-600">Total Doctors</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Patients</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-medium">69 appointments</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <Input
                label="Clinic Name"
                value={clinicData.clinicName}
                onChange={(e) => handleInputChange('clinicName', e.target.value)}
                disabled={!isEditing}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={clinicData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={clinicData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <Input
                label="Website"
                value={clinicData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                disabled={!isEditing}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={clinicData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={clinicData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* License & Accreditation */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">License & Accreditation</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Medical License Number"
                  value={clinicData.license}
                  onChange={(e) => handleInputChange('license', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Accreditation Number"
                  value={clinicData.accreditation}
                  onChange={(e) => handleInputChange('accreditation', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-24 text-sm font-medium text-gray-900">
                      {day.label}
                    </div>
                    <Input
                      type="time"
                      value={clinicData.operatingHours[day.key as keyof typeof clinicData.operatingHours].open}
                      onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    <div className="text-gray-500">to</div>
                    <Input
                      type="time"
                      value={clinicData.operatingHours[day.key as keyof typeof clinicData.operatingHours].close}
                      onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DollarSign className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Booking Settings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Before Booking</h4>
                    <p className="text-sm text-gray-600">Require patients to pay before confirming appointments</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('paymentBeforeBooking', !clinicData.paymentBeforeBooking)}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      clinicData.paymentBeforeBooking ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full transition-transform ${
                      clinicData.paymentBeforeBooking ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Automated Validation</h4>
                    <p className="text-sm text-gray-600">Use ML to validate bookings and prevent fraud</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('autoValidation', !clinicData.autoValidation)}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      clinicData.autoValidation ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full transition-transform ${
                      clinicData.autoValidation ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="text-orange-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive appointment updates via email</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('emailNotifications', !clinicData.emailNotifications)}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      clinicData.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full transition-transform ${
                      clinicData.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                    <p className="text-sm text-gray-600">Receive text message notifications</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('smsNotifications', !clinicData.smsNotifications)}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      clinicData.smsNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full transition-transform ${
                      clinicData.smsNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Booking Confirmations</h4>
                    <p className="text-sm text-gray-600">Send confirmation notifications for new bookings</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('bookingConfirmation', !clinicData.bookingConfirmation)}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      clinicData.bookingConfirmation ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full transition-transform ${
                      clinicData.bookingConfirmation ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};