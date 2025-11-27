import React, { useState } from 'react';
import { NotificationTestPanel } from '../../components/debug/NotificationTestPanel';
import { useAuth } from '../../hooks/useAuth'; // Assuming this exists

const NotificationTestPage: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const [customUserId, setCustomUserId] = useState('');
  const [userType, setUserType] = useState<'patient' | 'clinic' | 'doctor'>('patient');

  // Use current user ID or custom ID for testing
  const testUserId = customUserId.trim() || user?.id || 'test-user-123';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notification System Testing
          </h1>
          <p className="text-gray-600 mb-6">
            Use this page to test and validate the notification system functionality.
            You can send test notifications, monitor real-time updates, and verify system behavior.
          </p>

          {/* User Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test User ID
                </label>
                <input
                  type="text"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  placeholder={user?.id || 'Enter custom user ID'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use current logged-in user: <code>{user?.id || 'Not logged in'}</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'patient' | 'clinic' | 'doctor')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="clinic">Clinic</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Test Panel */}
        <NotificationTestPanel
          userId={testUserId}
          userType={userType}
        />

        {/* Help Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Basic Testing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fill out the notification form and click "Send Test"</li>
                <li>• Monitor the test results panel for success/error messages</li>
                <li>• Check that notifications appear in the Recent Notifications section</li>
                <li>• Verify unread count updates correctly</li>
                <li>• Test marking notifications as read/dismissed</li>
              </ul>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Real-time Testing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check the connection status indicator (should show "Connected")</li>
                <li>• Open multiple browser tabs/windows</li>
                <li>• Send notifications from one tab and verify they appear in others</li>
                <li>• Test browser notifications and audio alerts</li>
                <li>• Use "Quick Test" for rapid testing</li>
              </ul>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">System Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click the settings button to test system capabilities</li>
                <li>• Check browser notification permissions</li>
                <li>• Verify audio and vibration support</li>
                <li>• Monitor active subscriptions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Troubleshooting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• If real-time is disconnected, check network connectivity</li>
                <li>• Browser notifications require permission - allow when prompted</li>
                <li>• Audio alerts may be blocked by browser autoplay policies</li>
                <li>• Clear test results to start fresh</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;