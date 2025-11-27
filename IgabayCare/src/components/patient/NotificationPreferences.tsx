import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../supabaseClient';
import { authService } from '../../features/auth/utils/authService';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Clock,
  Calendar,
  Heart,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';

interface NotificationPreference {
  id?: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationCategory {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  preferences: NotificationPreference;
}

const defaultPreferences: Omit<NotificationPreference, 'id' | 'created_at' | 'updated_at'> = {
  user_id: '',
  notification_type: '',
  email_enabled: true,
  sms_enabled: false,
  push_enabled: true
};

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notificationTypes = [
    {
      type: 'appointment_booked',
      label: 'Appointment Booked',
      description: 'When you successfully book a new appointment',
      icon: <Calendar size={20} className="text-blue-600" />
    },
    {
      type: 'appointment_confirmed',
      label: 'Appointment Confirmed',
      description: 'When your appointment is confirmed by the clinic',
      icon: <CheckCircle size={20} className="text-green-600" />
    },
    {
      type: 'appointment_reminder',
      label: 'Appointment Reminders',
      description: 'Reminders before your scheduled appointments',
      icon: <Clock size={20} className="text-orange-600" />
    },
    {
      type: 'appointment_completed',
      label: 'Appointment Completed',
      description: 'When your appointment is marked as completed',
      icon: <Heart size={20} className="text-purple-600" />
    },
    {
      type: 'follow_up_scheduled',
      label: 'Follow-up Scheduled',
      description: 'When a follow-up appointment is recommended or scheduled',
      icon: <Calendar size={20} className="text-indigo-600" />
    },
    {
      type: 'payment_confirmed',
      label: 'Payment Confirmed',
      description: 'When your payment is successfully processed',
      icon: <CheckCircle size={20} className="text-green-600" />
    },
    {
      type: 'payment_failed',
      label: 'Payment Failed',
      description: 'When there are issues with your payment',
      icon: <AlertCircle size={20} className="text-red-600" />
    },
    {
      type: 'appointment_cancelled',
      label: 'Appointment Cancelled',
      description: 'When appointments are cancelled or rescheduled',
      icon: <AlertCircle size={20} className="text-red-600" />
    }
  ];

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setError('Please log in to manage notification preferences');
        return;
      }

      // Load existing preferences
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', currentUser.id);

      if (fetchError) {
        console.error('Error fetching notification preferences:', fetchError);
        setError('Failed to load notification preferences');
        return;
      }

      // Create a map of existing preferences
      const existingPrefsMap = new Map<string, NotificationPreference>();
      existingPrefs?.forEach(pref => {
        existingPrefsMap.set(pref.notification_type, pref);
      });

      // Initialize preferences for all notification types
      const allPreferences: NotificationPreference[] = notificationTypes.map(type => {
        const existing = existingPrefsMap.get(type.type);
        if (existing) {
          return existing;
        }
        
        // Create default preference for this type
        return {
          ...defaultPreferences,
          user_id: currentUser.id,
          notification_type: type.type
        };
      });

      setPreferences(allPreferences);
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (notificationType: string, field: keyof NotificationPreference, value: boolean) => {
    setPreferences(prev => prev.map(pref => {
      if (pref.notification_type === notificationType) {
        return { ...pref, [field]: value };
      }
      return pref;
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setError('Please log in to save preferences');
        return;
      }

      // Separate preferences that need to be inserted vs updated
      const toInsert = preferences.filter(pref => !pref.id);
      const toUpdate = preferences.filter(pref => pref.id);

      // Insert new preferences
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert(toInsert.map(pref => ({
            user_id: pref.user_id,
            notification_type: pref.notification_type,
            email_enabled: pref.email_enabled,
            sms_enabled: pref.sms_enabled,
            push_enabled: pref.push_enabled
          })));

        if (insertError) {
          console.error('Error inserting preferences:', insertError);
          setError('Failed to save some notification preferences');
          return;
        }
      }

      // Update existing preferences
      for (const pref of toUpdate) {
        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({
            email_enabled: pref.email_enabled,
            sms_enabled: pref.sms_enabled,
            push_enabled: pref.push_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', pref.id);

        if (updateError) {
          console.error('Error updating preference:', updateError);
          setError(`Failed to update ${pref.notification_type} preferences`);
          return;
        }
      }

      setSuccessMessage('Notification preferences saved successfully!');
      
      // Reload preferences to get the updated data with IDs
      await loadNotificationPreferences();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const currentUser = preferences[0]?.user_id;
    if (currentUser) {
      const resetPrefs = notificationTypes.map(type => ({
        ...defaultPreferences,
        user_id: currentUser,
        notification_type: type.type,
        id: preferences.find(p => p.notification_type === type.type)?.id
      }));
      setPreferences(resetPrefs);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="text-primary-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                <p className="text-gray-600 text-sm">
                  Choose how you want to receive notifications for different events
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={saving}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success/Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Notification Channel Headers */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Notification Type</div>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
              <Mail size={16} />
              <span className="hidden sm:inline">Email</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">SMS</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
              <Smartphone size={16} />
              <span className="hidden sm:inline">Push</span>
            </div>
          </div>

          {/* Notification Preferences List */}
          <div className="space-y-4">
            {notificationTypes.map(type => {
              const pref = preferences.find(p => p.notification_type === type.type);
              
              return (
                <div key={type.type} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  {/* Notification Type Info */}
                  <div className="flex items-start gap-3">
                    {type.icon}
                    <div>
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>

                  {/* Email Toggle */}
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref?.email_enabled || false}
                        onChange={(e) => updatePreference(type.type, 'email_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700 sm:hidden">Email</span>
                    </label>
                  </div>

                  {/* SMS Toggle */}
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref?.sms_enabled || false}
                        onChange={(e) => updatePreference(type.type, 'sms_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700 sm:hidden">SMS</span>
                    </label>
                  </div>

                  {/* Push Toggle */}
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref?.push_enabled || false}
                        onChange={(e) => updatePreference(type.type, 'push_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700 sm:hidden">Push</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={savePreferences}
              loading={saving}
              className="px-6"
            >
              <Save size={16} className="mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="text-blue-600" size={20} />
              <h3 className="font-semibold">Quick Setup</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                notificationTypes.forEach(type => {
                  updatePreference(type.type, 'email_enabled', true);
                  updatePreference(type.type, 'sms_enabled', false);
                  updatePreference(type.type, 'push_enabled', true);
                });
              }}
            >
              <Mail size={16} className="mr-2" />
              Email + Push Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                notificationTypes.forEach(type => {
                  updatePreference(type.type, 'email_enabled', true);
                  updatePreference(type.type, 'sms_enabled', true);
                  updatePreference(type.type, 'push_enabled', true);
                });
              }}
            >
              <Bell size={16} className="mr-2" />
              All Notifications
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                notificationTypes.forEach(type => {
                  updatePreference(type.type, 'email_enabled', false);
                  updatePreference(type.type, 'sms_enabled', false);
                  updatePreference(type.type, 'push_enabled', false);
                });
              }}
            >
              <Bell size={16} className="mr-2" />
              Disable All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-amber-600" size={20} />
              <h3 className="font-semibold">Important Notes</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              • <strong>Email notifications</strong> are sent to your registered email address
            </p>
            <p>
              • <strong>SMS notifications</strong> require a verified phone number
            </p>
            <p>
              • <strong>Push notifications</strong> work when you're logged in to the app
            </p>
            <p>
              • Critical appointment reminders will always be sent regardless of preferences
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationPreferences;
