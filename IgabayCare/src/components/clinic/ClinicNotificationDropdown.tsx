import React, { useState, useEffect } from 'react';
import { Bell, X, Check, DollarSign, User, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { ClinicNotificationService, ClinicNotification } from '../../services/clinicNotificationService';

interface ClinicNotificationDropdownProps {
  clinicUserId: string;
  className?: string;
}

export const ClinicNotificationDropdown: React.FC<ClinicNotificationDropdownProps> = ({
  clinicUserId,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!clinicUserId) return;

    try {
      setLoading(true);
      setError(null);

      const { notifications: fetchedNotifications, error: fetchError } = 
        await ClinicNotificationService.getClinicNotifications(clinicUserId, {
          limit: 20,
          unreadOnly: false
        });

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setNotifications(fetchedNotifications || []);
      
      // Count unread notifications
      const unread = fetchedNotifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching clinic notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { success, error: markError } = await ClinicNotificationService.markAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (markError) {
        setError(markError);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { success, error: markError } = await ClinicNotificationService.markAllAsRead(clinicUserId);
      
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (markError) {
        setError(markError);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId: string) => {
    try {
      const { success, error: dismissError } = await ClinicNotificationService.deleteNotification(notificationId);
      
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        const dismissedNotification = notifications.find(n => n.id === notificationId);
        if (dismissedNotification && !dismissedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else if (dismissError) {
        setError(dismissError);
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
      setError('Failed to dismiss notification');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-4 h-4 ${priority === 'urgent' ? 'text-red-500' : priority === 'high' ? 'text-orange-500' : 'text-blue-500'}`;
    
    switch (type) {
      case 'appointment_confirmed':
        return <Calendar className={iconClass} />;
      case 'appointment_cancelled':
        return <AlertCircle className={iconClass} />;
      case 'system':
        return <TrendingUp className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!clinicUserId) return;

    fetchNotifications();

    const { unsubscribe } = ClinicNotificationService.subscribeToClinicNotifications(
      clinicUserId,
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    return unsubscribe;
  }, [clinicUserId]);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            {/* Additional info for appointment notifications */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {notification.patient_name && (
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {notification.patient_name}
                                </span>
                              )}
                              {notification.doctor_name && (
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  Dr. {notification.doctor_name}
                                </span>
                              )}
                              {notification.revenue_amount && (
                                <span className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  ₱{notification.revenue_amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              
                              <div className="flex items-center space-x-2">
                                {!notification.is_read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => dismissNotification(notification.id)}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action button */}
                    {notification.action_url && notification.action_text && (
                      <div className="mt-3">
                        <a
                          href={notification.action_url}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {notification.action_text}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/clinic/notifications"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicNotificationDropdown;
