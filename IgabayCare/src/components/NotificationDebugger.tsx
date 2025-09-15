import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import RealTimeNotificationService from '../services/realTimeNotificationService';

interface NotificationDebuggerProps {
  userId: string;
  className?: string;
}

export const NotificationDebugger: React.FC<NotificationDebuggerProps> = ({ 
  userId, 
  className = "bg-gray-100 p-4 rounded-lg border" 
}) => {
  const { 
    connectionStatus, 
    isRealTimeConnected, 
    error, 
    forceReconnect, 
    testNotification 
  } = useNotifications(userId);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const supportInfo = RealTimeNotificationService.isSupported();
  const permissionInfo = RealTimeNotificationService.getPermissionStatus();

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">🔧 Notification Debug Panel</h3>
      
      {/* Connection Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Connection Status</h4>
        <div className="bg-white p-3 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <span>{getStatusIcon(connectionStatus.state)}</span>
            <span className={`font-medium ${getStatusColor(connectionStatus.state)}`}>
              {connectionStatus.state.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Real-time Connected: {isRealTimeConnected ? '✅' : '❌'}</div>
            <div>Active Subscriptions: {connectionStatus.subscriptions}</div>
            <div>Retry Attempts: {JSON.stringify(connectionStatus.retryAttempts)}</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Current Error</h4>
          <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Support Information */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Browser Support</h4>
        <div className="bg-white p-3 rounded border text-sm space-y-1">
          <div>Browser Notifications: {supportInfo.browserNotifications ? '✅' : '❌'}</div>
          <div>Real-time: {supportInfo.realTime ? '✅' : '❌'}</div>
          <div>Audio: {supportInfo.audio ? '✅' : '❌'}</div>
          <div>Vibration: {supportInfo.vibration ? '✅' : '❌'}</div>
          <div>Permission: {permissionInfo.granted ? '✅' : '❌'} ({permissionInfo.notification})</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={forceReconnect}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          🔄 Force Reconnect
        </button>
        
        <button
          onClick={testNotification}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          🧪 Test Notification
        </button>

        <button
          onClick={() => {
            console.log('Connection Status:', RealTimeNotificationService.getConnectionStatus());
            console.log('Subscription Status:', RealTimeNotificationService.getSubscriptionStatus());
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          📊 Log Debug Info
        </button>
      </div>

      {/* WebSocket Info */}
      <div className="mt-4 text-xs text-gray-500">
        <div>User ID: {userId}</div>
        <div>Timestamp: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default NotificationDebugger;