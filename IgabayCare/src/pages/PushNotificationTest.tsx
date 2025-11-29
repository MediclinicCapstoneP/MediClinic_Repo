import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { fcmTokenService } from '../services/fcmTokenService';
import { Button } from '../components/ui/Button';
import { 
  Bell, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Send,
  Trash2,
  Key,
  Loader2
} from 'lucide-react';

const PushNotificationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Test notification from MediClinic');
  const [testTitle, setTestTitle] = useState('Test Notification');
  
  const {
    notifications,
    unreadCount,
    isSupported,
    hasPermission,
    isLoading: notificationLoading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    sendTestNotification
  } = useNotifications();

  // Check detailed permission status
  const checkPermissionStatus = () => {
    const status = Notification.permission;
    console.log('🔍 Browser notification permission:', status);
    
    if (status === 'granted') {
      console.log('✅ Permission granted - notifications should work');
    } else if (status === 'denied') {
      console.log('❌ Permission denied - user blocked notifications');
      alert('Notifications are blocked. Please enable them in your browser settings.');
    } else if (status === 'default') {
      console.log('⏳ Permission not yet requested - call requestPermission() first');
    }
    
    return status;
  };

  // Initialize FCM token
  const initializeFCM = async () => {
    setIsLoading(true);
    try {
      const result = await fcmTokenService.initializeToken();
      if (result.success) {
        alert('FCM token initialized successfully!');
      } else {
        alert(`Failed to initialize FCM token: ${result.error}`);
      }
    } catch (error) {
      alert(`Error initializing FCM: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test notification without authentication
  const testWithoutAuth = () => {
    console.log('🔔 Testing notification without authentication...');
    
    if (Notification.permission !== 'granted') {
      alert('Please grant notification permission first');
      return;
    }
    
    try {
      const notification = new Notification('NO AUTH TEST', {
        body: 'This works without authentication!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
        tag: 'no-auth-test',
        requireInteraction: true
      });
      
      console.log('✅ No-auth notification created!');
      
      notification.onclick = function() {
        console.log('🖱️ No-auth notification clicked!');
        window.focus();
        notification.close();
      };
      
    } catch (error) {
      console.error('❌ No-auth notification failed:', error);
      alert('No-auth notification failed: ' + error);
    }
  };

  // Send direct browser notification (no service worker)
  const sendDirectNotification = () => {
    console.log('🔔 Testing DIRECT browser notification...');
    
    if (Notification.permission !== 'granted') {
      alert('Please grant notification permission first');
      return;
    }
    
    try {
      // Create notification directly without service worker
      const notification = new Notification('DIRECT TEST - Browser Notification', {
        body: 'This is a DIRECT test from browser (no service worker)',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
        tag: 'direct-test',
        requireInteraction: true // This keeps the notification visible until user interacts
      });
      
      console.log('✅ Direct notification created and should be visible!');
      
      // Add click handler
      notification.onclick = function() {
        console.log('🖱️ Direct notification clicked!');
        window.focus();
        notification.close();
      };
      
      // Log when notification is shown
      setTimeout(() => {
        console.log('📱 Direct notification should now be visible on your screen');
      }, 100);
      
    } catch (error) {
      console.error('❌ Direct notification failed:', error);
      alert('Direct notification failed: ' + error);
    }
  };

  // Send simple test notification (direct browser API)
  const sendSimpleNotification = () => {
    console.log('🔔 Testing simple browser notification...');
    
    if (Notification.permission !== 'granted') {
      alert('Please grant notification permission first');
      return;
    }
    
    try {
      const notification = new Notification('Simple Test', {
        body: 'This is a simple test notification',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
        tag: 'simple-test'
      });
      
      console.log('✅ Simple notification created!');
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        console.log('🔕 Simple notification closed');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Simple notification failed:', error);
      alert('Simple notification failed: ' + error);
    }
  };

  // Send custom test notification
  const sendCustomNotification = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        alert('Notification permission is required');
        return;
      }
    }

    try {
      // This would typically be sent from your backend
      // For testing, we'll use the local notification service
      await sendTestNotification();
    } catch (error) {
      alert(`Error sending notification: ${error}`);
    }
  };

  // Get current FCM token
  const getCurrentToken = () => {
    const token = fcmTokenService.getStoredToken();
    if (token) {
      alert(`Current token: ${token.token.substring(0, 20)}...`);
    } else {
      alert('No token stored');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Push Notification Test</h1>
          
          {/* Status Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Notification Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Supported: {isSupported ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Permission: {hasPermission ? 'Granted' : 'Denied'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${notificationLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Status: {notificationLoading ? 'Loading' : 'Ready'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Unread notifications: <span className="font-semibold">{unreadCount}</span>
            </div>
          </div>

          {/* Actions Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Test Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={requestPermission}
                disabled={hasPermission || notificationLoading}
                className="w-full"
              >
                {hasPermission ? 'Permission Granted' : 'Request Permission'}
              </Button>
              
              <Button
                onClick={checkPermissionStatus}
                variant="outline"
                className="w-full"
              >
                Check Permission Status
              </Button>
              
              <Button
                onClick={initializeFCM}
                disabled={isLoading || !hasPermission}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Initialize FCM Token
                  </>
                )}
              </Button>
              
              <Button
                onClick={testWithoutAuth}
                disabled={Notification.permission !== 'granted'}
                variant="outline"
                className="w-full bg-green-500 text-white hover:bg-green-600"
              >
                <Bell className="h-4 w-4 mr-2" />
                Test Without Auth (No Login Required)
              </Button>
              
              <Button
                onClick={sendSimpleNotification}
                disabled={Notification.permission !== 'granted'}
                variant="outline"
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Simple Test
              </Button>
              
              <Button
                onClick={sendDirectNotification}
                disabled={Notification.permission !== 'granted'}
                variant="outline"
                className="w-full bg-red-500 text-white hover:bg-red-600"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send DIRECT Test (No Service Worker)
              </Button>
              
              <Button
                onClick={sendTestNotification}
                disabled={!hasPermission || notificationLoading}
                variant="secondary"
                className="w-full"
              >
                {notificationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </>
                )}
              </Button>
              
              <Button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              
              <Button
                onClick={clearNotifications}
                disabled={notifications.length === 0}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              <Button
                onClick={getCurrentToken}
                variant="outline"
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Get Current Token
              </Button>
            </div>
          </div>

          {/* Custom Notification Form */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Test Notification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notification title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>
              
              <Button
                onClick={sendCustomNotification}
                disabled={!hasPermission}
                className="w-full"
              >
                Send Custom Notification
              </Button>
            </div>
          </div>

          {/* Recent Notifications */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle className="h-4 w-4" />
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
    </div>
  );
};

export default PushNotificationTest;
