import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';
import { NotificationService } from '../../services/notificationService';
import { NotificationPreferences } from '../../types/notifications';

interface NotificationPreferencesPanelProps {
  userId: string;
  userType: 'patient' | 'clinic' | 'doctor';
  onClose?: () => void;
}

interface PreferenceSection {
  title: string;
  description: string;
  preferences: Array<{
    key: keyof NotificationPreferences;
    label: string;
    description: string;
    channels: Array<'email' | 'push' | 'sms'>;
  }>;
}

const PREFERENCE_SECTIONS: PreferenceSection[] = [
  {
    title: 'Appointment Notifications',
    description: 'Get notified about your appointments',
    preferences: [
      {
        key: 'email_appointment_confirmed',
        label: 'Appointment Confirmed',
        description: 'When your appointment is confirmed by the clinic',
        channels: ['email', 'push', 'sms']
      },
      {
        key: 'email_appointment_reminder',
        label: 'Appointment Reminders',
        description: 'Reminders before your upcoming appointments',
        channels: ['email', 'push', 'sms']
      },
      {
        key: 'email_appointment_cancelled',
        label: 'Appointment Cancelled',
        description: 'When your appointment is cancelled',
        channels: ['email', 'push', 'sms']
      },
      {
        key: 'email_appointment_completed',
        label: 'Appointment Completed',
        description: 'After your appointment is completed',
        channels: ['email', 'push']
      }
    ]
  },
  {
    title: 'Medical Notifications',
    description: 'Stay updated about your health records',
    preferences: [
      {
        key: 'email_prescription_ready',
        label: 'Prescription Ready',
        description: 'When your prescription is ready for pickup',
        channels: ['email', 'push']
      },
      {
        key: 'email_lab_results',
        label: 'Lab Results Available',
        description: 'When your lab results are ready',
        channels: ['email', 'push']
      }
    ]
  },
  {
    title: 'Reviews & Feedback',
    description: 'Help us improve our services',
    preferences: [
      {
        key: 'email_review_request',
        label: 'Review Requests',
        description: 'Requests to review your care experience',
        channels: ['email', 'push']
      }
    ]
  },
  {
    title: 'Payment & Billing',
    description: 'Stay informed about payments and bills',
    preferences: [
      {
        key: 'email_payment_notifications',
        label: 'Payment Notifications',
        description: 'Payment confirmations and receipt notifications',
        channels: ['email', 'push']
      }
    ]
  },
  {
    title: 'System Notifications',
    description: 'Important system updates and security alerts',
    preferences: [
      {
        key: 'email_system_notifications',
        label: 'System Updates',
        description: 'Important system maintenance and feature updates',
        channels: ['email', 'push']
      }
    ]
  }
];

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  userId,
  userType,
  onClose
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const { preferences: userPrefs, error: loadError } = await NotificationService.getNotificationPreferences(userId);
        
        if (loadError) {
          setError(loadError);
        } else if (userPrefs) {
          setPreferences(userPrefs);
        }
      } catch (err) {
        setError('Failed to load notification preferences');
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  // Handle preference change
  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setPreferences(prev => ({
      ...prev!,
      [key]: value
    }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Handle global toggle for notification channels
  const handleChannelToggle = (channel: 'email' | 'push' | 'sms', enabled: boolean) => {
    if (!preferences) return;

    const updates: Partial<NotificationPreferences> = {
      [`${channel}_enabled`]: enabled
    };

    // If disabling, also disable all specific notifications for that channel
    if (!enabled) {
      Object.keys(preferences).forEach(key => {
        if (key.startsWith(`${channel}_`)) {
          updates[key as keyof NotificationPreferences] = false as any;
        }
      });
    }

    setPreferences(prev => ({
      ...prev!,
      ...updates
    }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Save preferences
  const handleSave = async () => {
    if (!preferences || !hasChanges) return;

    try {
      setSaving(true);
      setError(null);

      const { preferences: updatedPrefs, error: saveError } = await NotificationService.updateNotificationPreferences(
        userId,
        preferences
      );

      if (saveError) {
        setError(saveError);
      } else if (updatedPrefs) {
        setPreferences(updatedPrefs);
        setSuccessMessage('Notification preferences saved successfully!');
        setHasChanges(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to save notification preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default preferences
  const handleReset = () => {
    if (!preferences) return;

    // Default preferences
    const defaultPrefs: Partial<NotificationPreferences> = {
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      email_appointment_confirmed: true,
      email_appointment_reminder: true,
      email_appointment_cancelled: true,
      email_appointment_completed: true,
      email_review_request: true,
      email_prescription_ready: true,
      email_lab_results: true,
      email_payment_notifications: true,
      email_system_notifications: true,
      push_appointment_confirmed: true,
      push_appointment_reminder: true,
      push_appointment_cancelled: true,
      push_appointment_completed: true,
      push_review_request: true,
      push_prescription_ready: true,
      push_lab_results: true,
      push_payment_notifications: false,
      push_system_notifications: false,
      sms_appointment_confirmed: false,
      sms_appointment_reminder: false,
      sms_appointment_cancelled: false,
      sms_security_alerts: false
    };

    setPreferences(prev => ({
      ...prev!,
      ...defaultPrefs
    }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'push':
        return <Smartphone className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Email';
      case 'push':
        return 'Push';
      case 'sms':
        return 'SMS';
      default:
        return channel;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Preferences</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Notification Preferences
          </h1>
          <p className="text-gray-600 mt-1">
            Choose how and when you want to receive notifications
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Global Channel Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Email</h3>
                <p className="text-sm text-gray-600">Get notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => handleChannelToggle('email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Push</h3>
                <p className="text-sm text-gray-600">Browser and mobile notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) => handleChannelToggle('push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">SMS</h3>
                <p className="text-sm text-gray-600">Text message notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms_enabled}
                onChange={(e) => handleChannelToggle('sms', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preference Sections */}
      {PREFERENCE_SECTIONS.map((section) => (
        <div key={section.title} className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
          <p className="text-gray-600 mb-4">{section.description}</p>
          
          <div className="space-y-4">
            {section.preferences.map((pref) => (
              <div key={pref.key} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{pref.label}</h4>
                    <p className="text-sm text-gray-600">{pref.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-2">
                  {pref.channels.map((channel) => {
                    const channelKey = `${channel}_${pref.key.replace('email_', '')}` as keyof NotificationPreferences;
                    const channelEnabled = preferences[`${channel}_enabled` as keyof NotificationPreferences] as boolean;
                    const isChecked = preferences[channelKey] as boolean;
                    
                    return (
                      <label 
                        key={channel}
                        className={`flex items-center space-x-2 ${!channelEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked && channelEnabled}
                          disabled={!channelEnabled}
                          onChange={(e) => handlePreferenceChange(channelKey, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div className="flex items-center space-x-1">
                          {getChannelIcon(channel)}
                          <span className="text-sm text-gray-700">{getChannelName(channel)}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Quiet Hours Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Quiet Hours
        </h2>
        <p className="text-gray-600 mb-4">
          Set a time range when you don't want to receive notifications (except urgent ones)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_start || '22:00'}
              onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_end || '08:00'}
              onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-amber-600">You have unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPanel;