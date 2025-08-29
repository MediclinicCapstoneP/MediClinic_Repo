import React, { useState } from 'react';
import { Bell, CheckCircle, Star, X, Calendar, MapPin, Clock, User } from 'lucide-react';
import { Notification } from '../../services/notificationService';

interface AppointmentCompletionNotificationProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onRateAppointment?: (appointmentId: string) => void;
  className?: string;
}

export const AppointmentCompletionNotification: React.FC<AppointmentCompletionNotificationProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onRateAppointment,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleMarkAsRead = () => {
    if (onMarkAsRead && !notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(notification.id);
    }
  };

  const handleRateClick = () => {
    if (onRateAppointment && notification.appointment_id) {
      onRateAppointment(notification.appointment_id);
    }
    handleMarkAsRead();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'normal':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-200 hover:shadow-md
        ${getPriorityColor(notification.priority)}
        ${!notification.is_read ? 'ring-2 ring-blue-300' : ''}
        ${className}
      `}
      onClick={!notification.is_read ? handleMarkAsRead : undefined}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500"></div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h3>
                {notification.priority === 'high' || notification.priority === 'urgent' ? (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    notification.priority === 'urgent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {notification.priority}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>

              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTimeAgo(notification.created_at)}
                </span>
                {notification.metadata?.clinic_name && (
                  <span className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3" />
                    {notification.metadata.clinic_name}
                  </span>
                )}
                {notification.metadata?.appointment_date && (
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(notification.metadata.appointment_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {notification.action_text && notification.appointment_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRateClick();
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Star className="mr-2 h-4 w-4" />
              {notification.action_text}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isExpanded ? 'Less Details' : 'More Details'}
          </button>

          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Mark as Read
            </button>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="space-y-2 text-sm">
              {notification.metadata?.clinic_name && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Clinic:</span>
                  <span className="font-medium text-gray-900">{notification.metadata.clinic_name}</span>
                </div>
              )}
              {notification.metadata?.appointment_date && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(notification.metadata.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Notification ID:</span>
                <span className="font-mono text-xs text-gray-500">{notification.id.slice(-8)}</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Share Your Experience
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your feedback helps other patients make informed decisions and helps clinics improve their services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator for expiring notifications */}
      {notification.expires_at && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{
              width: `${Math.max(0, Math.min(100, 
                ((new Date(notification.expires_at).getTime() - Date.now()) / 
                 (24 * 60 * 60 * 1000)) * 100
              ))}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Notification List Component
interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onRateAppointment?: (appointmentId: string) => void;
  maxHeight?: string;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  onRateAppointment,
  maxHeight = 'max-h-96',
  className = ''
}) => {
  const appointmentCompletionNotifications = notifications.filter(
    n => n.type === 'appointment_completed'
  );

  if (appointmentCompletionNotifications.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Bell className="mx-auto h-8 w-8 mb-2 text-gray-300" />
        <p>No appointment completion notifications</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 overflow-y-auto ${maxHeight} ${className}`}>
      {appointmentCompletionNotifications.map((notification) => (
        <AppointmentCompletionNotification
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
          onRateAppointment={onRateAppointment}
        />
      ))}
    </div>
  );
};

export default AppointmentCompletionNotification;