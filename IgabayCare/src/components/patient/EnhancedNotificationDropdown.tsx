import React, { useState, useRef, useEffect } from 'react';
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
  CheckCheck,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useEnhancedNotifications } from '../../hooks/useEnhancedNotifications';
import { Notification } from '../../services/notificationService';
import { EnhancedNotificationFilters } from '../../services/enhancedNotificationService';

interface EnhancedNotificationDropdownProps {
  userId: string;
  className?: string;
  maxHeight?: string;
}

export const EnhancedNotificationDropdown: React.FC<EnhancedNotificationDropdownProps> = ({ 
  userId, 
  className = '',
  maxHeight = 'max-h-96'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    stats,
    loading,
    error,
    hasMore,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    dismiss,
    dismissMultiple,
    refresh,
    loadMore,
    updateFilters
  } = useEnhancedNotifications(userId, {
    autoRefresh: true,
    refreshInterval: 30000,
    filters: { limit: 20 },
    realTime: true
  });

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
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
  };
  
  // Handle dismiss notification
  const handleDismiss = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await dismiss(notificationId);
  };
  
  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length > 0) {
      await markMultipleAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedNotifications.length > 0) {
      await dismissMultiple(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Select all notifications
  const selectAllNotifications = () => {
    setSelectedNotifications(notifications.map(n => n.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  // Apply filters
  const handleFilterChange = (newFilters: Partial<EnhancedNotificationFilters>) => {
    updateFilters(newFilters);
    setShowFilters(false);
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
        setShowFilters(false);
        setSelectedNotifications([]);
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

  const unreadCount = stats?.unread || 0;
  const hasHighPriority = notifications.some(n => !n.is_read && (n.priority === 'high' || n.priority === 'urgent'));

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
        {hasHighPriority && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 border-2 border-white rounded-full animate-ping" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${maxHeight} flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {stats && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {stats.unread} unread
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{stats.total} total</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Refresh */}
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>

                {/* Filters */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
                
                {/* Settings */}
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedNotifications.length} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark as read
                  </button>
                  <button
                    onClick={handleBulkDismiss}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllNotifications}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Select all
                </button>
                {unreadCount > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      onChange={(e) => handleFilterChange({ 
                        type: e.target.value ? [e.target.value] : undefined 
                      })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">All Types</option>
                      <option value="appointment_confirmed">Confirmed</option>
                      <option value="appointment_reminder">Reminders</option>
                      <option value="appointment_completed">Completed</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      onChange={(e) => handleFilterChange({ 
                        priority: e.target.value ? [e.target.value] : undefined 
                      })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="readStatus"
                      onChange={() => handleFilterChange({ isRead: undefined })}
                      className="mr-1"
                      defaultChecked
                    />
                    <span className="text-xs text-gray-700">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="readStatus"
                      onChange={() => handleFilterChange({ isRead: false })}
                      className="mr-1"
                    />
                    <span className="text-xs text-gray-700">Unread</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="readStatus"
                      onChange={() => handleFilterChange({ isRead: true })}
                      className="mr-1"
                    />
                    <span className="text-xs text-gray-700">Read</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
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
              <>
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const isUnread = !notification.is_read;
                    const isHighPriority = notification.priority === 'high' || notification.priority === 'urgent';
                    const isSelected = selectedNotifications.includes(notification.id);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`group relative p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isUnread ? 'bg-blue-50/50' : ''
                        } ${isHighPriority ? 'border-l-4 border-orange-400' : ''} ${
                          isSelected ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="flex space-x-3">
                          {/* Selection Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleNotificationSelection(notification.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isUnread ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {getNotificationIcon(notification.type, notification.priority)}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div 
                            className="flex-1 min-w-0"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Priority badge */}
                                {isHighPriority && (
                                  <div className="mb-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                      {notification.priority?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                
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
                                    {new Date(notification.created_at).toLocaleDateString()}
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

                {/* Load More */}
                {hasMore && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load more notifications'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex items-center justify-between">
                {unreadCount > 0 ? (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark all as read</span>
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">All caught up! 🎉</span>
                )}
                
                <div className="text-xs text-gray-400">
                  {stats?.recentCount || 0} in last 24h
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationDropdown;
