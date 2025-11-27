import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Volume2,
  VolumeX,
  Settings,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  TestTube
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationService } from '../../services/notificationService';
import RealTimeNotificationService from '../../services/realTimeNotificationService';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../types/notifications';

interface NotificationTestPanelProps {
  userId: string;
  userType?: 'patient' | 'clinic' | 'doctor';
}

export const NotificationTestPanel: React.FC<NotificationTestPanelProps> = ({
  userId,
  userType = 'patient'
}) => {
  const [testMessage, setTestMessage] = useState('This is a test notification');
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testType, setTestType] = useState('system');
  const [testPriority, setTestPriority] = useState('normal');
  const [sending, setSending] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    isRealTimeConnected,
    testNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh
  } = useNotifications(userId, {
    realTime: true,
    playSound: true,
    showBrowserNotification: true,
    vibrate: true
  });

  // Add test result
  const addTestResult = (result: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedResult = `[${timestamp}] ${type.toUpperCase()}: ${result}`;
    setTestResults(prev => [formattedResult, ...prev.slice(0, 9)]);
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!userId || sending) return;

    try {
      setSending(true);
      addTestResult(`Sending test notification: ${testTitle}`, 'info');

      const result = await NotificationService.createNotification({
        user_id: userId,
        user_type: userType,
        type: testType as any,
        title: testTitle,
        message: testMessage,
        priority: testPriority as any,
        action_url: '/test-notification',
        action_text: 'View Test'
      });

      if (result.error) {
        addTestResult(`Failed to send: ${result.error}`, 'error');
      } else {
        addTestResult('Test notification sent successfully!', 'success');
      }
    } catch (err) {
      addTestResult(`Error: ${err}`, 'error');
    } finally {
      setSending(false);
    }
  };

  // Test system features
  const testSystemFeatures = async () => {
    addTestResult('Testing system features...', 'info');

    // Test permissions
    const permissions = RealTimeNotificationService.getPermissionStatus();
    addTestResult(`Browser notifications: ${permissions.granted ? 'Granted' : 'Denied'}`, permissions.granted ? 'success' : 'error');

    // Test support
    const support = RealTimeNotificationService.isSupported();
    addTestResult(`Real-time support: ${support.realTime ? 'Yes' : 'No'}`, support.realTime ? 'success' : 'error');
    addTestResult(`Audio support: ${support.audio ? 'Yes' : 'No'}`, support.audio ? 'success' : 'error');
    addTestResult(`Vibration support: ${support.vibration ? 'Yes' : 'No'}`, support.vibration ? 'success' : 'error');

    // Test subscription status
    const subscriptionStatus = RealTimeNotificationService.getSubscriptionStatus();
    addTestResult(`Active subscriptions: ${subscriptionStatus.count}`, 'info');
    
    if (subscriptionStatus.active.length > 0) {
      subscriptionStatus.active.forEach(sub => {
        addTestResult(`- ${sub}`, 'info');
      });
    }
  };

  // Clear test results
  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TestTube className="w-6 h-6 mr-2 text-blue-600" />
            Notification System Test Panel
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isRealTimeConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isRealTimeConnected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
              {isRealTimeConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Bell className="w-4 h-4 mr-1" />
              {unreadCount} Unread
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="text-gray-600">
          <p>Test the notification system by sending test notifications and monitoring real-time updates.</p>
          <p className="text-sm mt-1">User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Test Notification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Test notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Test notification message"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={testPriority}
                  onChange={(e) => setTestPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(NOTIFICATION_PRIORITIES).map(([key, value]) => (
                    <option key={key} value={value}>{key}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={sendTestNotification}
                disabled={sending || !testTitle.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Test'}
              </button>

              <button
                onClick={testSystemFeatures}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                title="Test System Features"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Wifi className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium">Real-time Connection</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isRealTimeConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isRealTimeConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {/* Notification Stats */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-purple-600 mr-3" />
                <span className="font-medium">Total Notifications</span>
              </div>
              <span className="font-bold text-lg">{notifications.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="font-medium">Unread Count</span>
              </div>
              <span className="font-bold text-lg text-red-600">{unreadCount}</span>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
              <div className="flex space-x-2">
                <button
                  onClick={testNotification}
                  className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                >
                  Quick Test
                </button>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  Refresh
                </button>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Mark All Read
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
            <button
              onClick={clearTestResults}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
          </div>

          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No test results yet. Send a test notification to see results.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => {
                const isError = result.includes('ERROR:');
                const isSuccess = result.includes('SUCCESS:');
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-md font-mono text-sm ${
                      isError ? 'bg-red-50 text-red-800' :
                      isSuccess ? 'bg-green-50 text-green-800' :
                      'bg-gray-50 text-gray-800'
                    }`}
                  >
                    {result}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Notifications ({notifications.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No notifications received yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Type: {notification.type}</span>
                        <span>Priority: {notification.priority || 'normal'}</span>
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Dismiss"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPanel;