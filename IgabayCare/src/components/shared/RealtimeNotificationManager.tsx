/**
 * Real-time Notification Manager - Comprehensive notification system for workflow updates
 * Handles real-time notifications, status updates, and user notifications across all roles
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedBookingService } from '../services/enhancedBookingService';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/Button';
import { 
  Bell, X, CheckCircle, AlertCircle, Info, Calendar, User, FileText,
  Clock, Star, RefreshCw, Loader2, Volume2, VolumeX
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  user_type: 'patient' | 'clinic' | 'doctor';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  appointment_id?: string;
  prescription_id?: string;
}

interface RealtimeNotificationManagerProps {
  userId: string;
  userType: 'patient' | 'clinic' | 'doctor';
  onNotificationClick?: (notification: Notification) => void;
  showSettings?: boolean;
}

export const RealtimeNotificationManager: React.FC<RealtimeNotificationManagerProps> = ({
  userId,
  userType,
  onNotificationClick,
  showSettings = true
}) => {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize sound
  useEffect(() => {
    soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const result = await enhancedBookingService.getUserNotifications(userId, userType);
      if (result.success) {
        setNotifications(result.data || []);
      } else {
        console.error('Error loading notifications:', result.error);
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await enhancedBookingService.getUnreadNotificationCount(userId, userType);
      if (result.success) {
        setUnreadCount(result.data?.count || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [userId, userType]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const result = await enhancedBookingService.markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled && soundRef.current) {
      soundRef.current.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'appointment_booked': Calendar,
      'appointment_confirmed': CheckCircle,
      'appointment_declined': AlertCircle,
      'appointment_completed': CheckCircle,
      'appointment_assigned': User,
      'prescription_available': FileText,
      'prescription_submitted': FileText,
      'rating_received': Star,
      'new_booking': Calendar,
      'payment_confirmed': CheckCircle,
      'appointment_reminder': Clock,
      'follow_up_scheduled': Calendar,
      'system_update': Info
    };

    const Icon = iconMap[type] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'appointment_booked': 'bg-blue-100 text-blue-600',
      'appointment_confirmed': 'bg-green-100 text-green-600',
      'appointment_declined': 'bg-red-100 text-red-600',
      'appointment_completed': 'bg-green-100 text-green-600',
      'appointment_assigned': 'bg-purple-100 text-purple-600',
      'prescription_available': 'bg-blue-100 text-blue-600',
      'prescription_submitted': 'bg-green-100 text-green-600',
      'rating_received': 'bg-yellow-100 text-yellow-600',
      'new_booking': 'bg-blue-100 text-blue-600',
      'payment_confirmed': 'bg-green-100 text-green-600',
      'appointment_reminder': 'bg-yellow-100 text-yellow-600',
      'follow_up_scheduled': 'bg-purple-100 text-purple-600',
      'system_update': 'bg-gray-100 text-gray-600'
    };

    return colorMap[type] || 'bg-gray-100 text-gray-600';
  };

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onNotificationClick?.(notification);
    setShowDropdown(false);
  };

  // Real-time subscription
  useEffect(() => {
    if (!userId || !userType) return;

    const channel = supabase
      .channel('workflow_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep latest 50
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadNotifications, loadUnreadCount]);

  // Initial load
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {showSettings && (
                <>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                  >
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  onClick={loadNotifications}
                  size="sm"
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <>
                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}

                {/* Notifications list */}
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="ml-2 mt-1">
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={loadNotifications}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Status Update Component for real-time status tracking
interface StatusUpdateProps {
  appointmentId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export const StatusUpdate: React.FC<StatusUpdateProps> = ({
  appointmentId,
  currentStatus,
  onStatusChange
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Real-time status updates
  useEffect(() => {
    const channel = supabase
      .channel(`appointment_status_${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`
        },
        (payload) => {
          const newStatus = payload.new.status as string;
          setStatus(newStatus);
          setLastUpdated(new Date().toISOString());
          onStatusChange?.(newStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, onStatusChange]);

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      prescribed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      pending: 'Pending Assignment',
      assigned: 'Assigned to Doctor',
      confirmed: 'Confirmed',
      declined: 'Declined',
      in_progress: 'In Progress',
      completed: 'Completed',
      prescribed: 'Prescription Issued',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    };

    return labelMap[status] || status;
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
      {lastUpdated && (
        <span className="text-xs text-gray-500">
          Updated {formatTime(lastUpdated)}
        </span>
      )}
    </div>
  );
};

// Helper function for formatting time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
