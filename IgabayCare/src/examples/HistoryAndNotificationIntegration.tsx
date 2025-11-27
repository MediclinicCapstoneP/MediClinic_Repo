import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PatientHistory } from '../pages/patient/PatientHistory';
import { EnhancedNotificationDropdown } from '../components/patient/EnhancedNotificationDropdown';
import { useEnhancedNotifications } from '../hooks/useEnhancedNotifications';
import { EnhancedHistoryService } from '../services/enhancedHistoryService';
import { Bell, History, User, Activity, TrendingUp } from 'lucide-react';

interface IntegrationExampleProps {
  patientId: string;
  userId: string;
}

/**
 * Comprehensive example showing how to integrate the enhanced history and notification systems
 * with full Supabase backend functionality
 */
export const HistoryAndNotificationIntegration: React.FC<IntegrationExampleProps> = ({
  patientId,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notifications'>('overview');
  const [patientStats, setPatientStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced notifications hook with full functionality
  const {
    notifications,
    stats: notificationStats,
    markAsRead,
    createAppointmentNotification,
    createSystemNotification
  } = useEnhancedNotifications(userId, {
    autoRefresh: true,
    refreshInterval: 30000,
    filters: { limit: 10 },
    realTime: true
  });

  // Load patient statistics on mount
  useEffect(() => {
    const loadPatientStats = async () => {
      try {
        setLoading(true);
        const result = await EnhancedHistoryService.getPatientStatistics(patientId);
        if (result.success) {
          setPatientStats(result.stats);
        }
      } catch (error) {
        console.error('Error loading patient stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatientStats();
    }
  }, [patientId]);

  // Demo functions for testing the integration
  const handleCreateTestNotification = async () => {
    await createSystemNotification(
      'Test Notification',
      'This is a test notification to demonstrate the enhanced notification system.',
      {
        priority: 'normal',
        actionUrl: '/test',
        actionText: 'View Test'
      }
    );
  };

  const handleCreateAppointmentNotification = async () => {
    // This would typically use a real appointment ID
    await createAppointmentNotification(
      'test-appointment-id',
      'appointment_reminder',
      {
        title: 'Appointment Reminder',
        message: 'You have an appointment tomorrow at 2:00 PM',
        priority: 'high'
      }
    );
  };

  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notificationStats?.unread || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Enhanced Notification Dropdown */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Patient Dashboard Integration
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive history and notification system with Supabase backend
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Enhanced Notification Dropdown */}
          <EnhancedNotificationDropdown 
            userId={userId}
            className="relative"
            maxHeight="max-h-96"
          />
          
          {/* Demo Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleCreateTestNotification}
              variant="outline"
              size="sm"
            >
              Test Notification
            </Button>
            <Button
              onClick={handleCreateAppointmentNotification}
              variant="outline"
              size="sm"
            >
              Test Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : patientStats?.totalAppointments || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : patientStats?.completedAppointments || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₱{loading ? '...' : (patientStats?.totalSpent || 0).toLocaleString()}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-orange-600">
                  {unreadCount}
                </p>
                <p className="text-xs text-gray-500">unread</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Medical History
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Notifications */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                  <Button
                    onClick={() => setActiveTab('notifications')}
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>
                
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No recent notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Prescriptions</span>
                    <span className="text-sm font-medium">
                      {patientStats?.totalPrescriptions || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medical Records</span>
                    <span className="text-sm font-medium">
                      {patientStats?.totalMedicalRecords || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Appointment</span>
                    <span className="text-sm font-medium">
                      {patientStats?.lastAppointmentDate 
                        ? new Date(patientStats.lastAppointmentDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notification Stats</span>
                    <span className="text-sm font-medium">
                      {notificationStats?.total || 0} total, {notificationStats?.recentCount || 0} recent
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <PatientHistory patientId={patientId} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">All Notifications</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {notificationStats?.total || 0} total, {unreadCount} unread
                  </span>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No notifications</h4>
                  <p className="text-gray-500">You're all caught up! New notifications will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.is_read 
                          ? 'bg-white border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {notification.priority === 'high' || notification.priority === 'urgent' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {notification.priority.toUpperCase()}
                              </span>
                            ) : null}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                            {notification.action_text && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">
                                  {notification.action_text}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          <div className={`w-2 h-2 rounded-full ${
                            notification.is_read ? 'bg-gray-300' : 'bg-blue-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Integration Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 Enhanced History & Notification Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">History Features:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Comprehensive medical history with timeline</li>
                <li>• Advanced filtering and search</li>
                <li>• Real-time data from Supabase</li>
                <li>• Appointment, prescription, and medical records</li>
                <li>• Patient statistics and analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Notification Features:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Real-time notifications with Supabase</li>
                <li>• Priority-based filtering and sorting</li>
                <li>• Bulk actions (mark as read, dismiss)</li>
                <li>• Appointment and system notifications</li>
                <li>• Enhanced UI with statistics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryAndNotificationIntegration;
