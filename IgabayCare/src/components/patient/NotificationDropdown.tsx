import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  Star, 
  CreditCard, 
  FileText,
  Settings,
  CheckCheck
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notificationService';
import {
  NOTIFICATION_COLORS,
  PRIORITY_COLORS,
  getNotificationDisplayText,
  formatRelativeTime,
  isHighPriority
} from '../../types/notifications';
import ErrorBoundary from '../ui/ErrorBoundary';

interface NotificationDropdownProps {
  patientId: string;
  className?: string;
}

const NotificationDropdownComponent: React.FC<NotificationDropdownProps> = ({ 
  patientId, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Safely get notifications with error handling and connection management
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh
  } = useNotifications(patientId || '', {
    autoRefresh: true,
    refreshInterval: 60000, // Increased to 60 seconds to reduce connection load
    limit: 20,
    realTime: false, // Keep real-time disabled to prevent connection closure errors
    retryOnError: true,
    maxRetries: 3
  });

  // Don't render if no patientId
  if (!patientId) {
    return (
      <button className={`relative p-2 text-gray-400 cursor-not-allowed rounded-full ${className}`}>
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    );
  }

  // Handle notification click with error handling
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      
      // Handle action URL if present
      if (notification.action_url) {
        if (notification.action_url.startsWith('http')) {
          window.open(notification.action_url, '_blank');
        } else {
          // Handle internal routing
          console.log('Navigate to:', notification.action_url);
        }
      }
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
      // Still allow navigation even if marking as read fails
      if (notification.action_url) {
        if (notification.action_url.startsWith('http')) {
          window.open(notification.action_url, '_blank');
        } else {
          console.log('Navigate to:', notification.action_url);
        }
      }
    }
  };
  
  // Handle dismiss notification with error handling
  const handleDismiss = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await dismiss(notificationId);
    } catch (error) {
      console.warn('Failed to dismiss notification:', error);
      // Optionally show a toast notification here
    }
  };
  
  // Handle mark all as read with error handling
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.warn('Failed to mark all notifications as read:', error);
      // Optionally show a toast notification here
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string, priority: string = 'normal') => {
    const iconClass = "w-4 h-4";
    const isUrgent = priority === 'urgent' || priority === 'high';
    
    switch (type) {
      case 'appointment_confirmed':
      case 'appointment_completed':
        return <Check className={`${iconClass} text-green-600`} />;
      case 'appointment_reminder':
        return <Calendar className={`${iconClass} text-blue-600`} />;
      case 'appointment_cancelled':
        return <X className={`${iconClass} text-red-600`} />;
      case 'appointment_rescheduled':
        return <Calendar className={`${iconClass} text-yellow-600`} />;
      case 'review_request':
      case 'review_received':
        return <Star className={`${iconClass} text-purple-600`} />;
      case 'prescription_ready':
      case 'lab_results_available':
      case 'medical_record_updated':
        return <FileText className={`${iconClass} text-emerald-600`} />;
      case 'payment_successful':
      case 'payment_failed':
      case 'refund_processed':
      case 'invoice_generated':
        return <CreditCard className={`${iconClass} text-blue-600`} />;
      case 'security':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case 'system':
      case 'maintenance':
      case 'feature_update':
        return <Info className={`${iconClass} ${isUrgent ? 'text-orange-600' : 'text-gray-600'}`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* High priority indicator */}
        {notifications.some(n => !n.is_read && isHighPriority(n.priority || 'normal')) && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 border-2 border-white rounded-full animate-ping" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <p className="text-red-600 text-sm font-medium mb-2">Error loading notifications</p>
                <p className="text-gray-500 text-sm mb-3">{error}</p>
                <button
                  onClick={refresh}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const priorityColor = PRIORITY_COLORS[notification.priority || 'normal'];
                  const isUnread = !notification.is_read;
                  const isHighPriority = notification.priority === 'high' || notification.priority === 'urgent';
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-blue-50/50' : ''
                      } ${isHighPriority ? 'border-l-4 border-orange-400' : ''}`}
                    >
                      <div className="flex space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isUnread ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Type badge */}
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  NOTIFICATION_COLORS[notification.type as keyof typeof NOTIFICATION_COLORS] ||
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {getNotificationDisplayText(notification.type)}
                                </span>
                                {isHighPriority && (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
                                    {notification.priority?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              
                              {/* Title */}
                              <p className={`text-sm font-medium ${
                                isUnread ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              
                              {/* Message */}
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {/* Metadata */}
                              <div className="flex items-center space-x-2 mt-2">
                                <p className="text-xs text-gray-400">
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                                {notification.action_text && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    {notification.action_text}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-1 ml-2">
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => handleDismiss(notification.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex items-center justify-between">
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark all as read</span>
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">All caught up! 🎉</span>
                )}
                
                <button
                  onClick={refresh}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  title="Refresh notifications"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Wrap with error boundary for safer rendering
export const NotificationDropdown: React.FC<NotificationDropdownProps> = (props) => {
  return (
    <ErrorBoundary 
      fallback={
        <button className={`relative p-2 text-gray-400 cursor-not-allowed rounded-full ${props.className || ''}`}>
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      }
    >
      <NotificationDropdownComponent {...props} />
    </ErrorBoundary>
  );
};

export default NotificationDropdown;
