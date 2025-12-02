import React, { useState } from 'react';
import { Bell, User, Heart, LogOut, Calendar, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NotificationDropdown } from '../patient/NotificationDropdown';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'system' | 'update';
  timestamp: string;
  read: boolean;
}

interface PatientNavbarProps {
  user: any;
  onSignOut: () => void;
  activeTab?: string;
}

export const PatientNavbar: React.FC<PatientNavbarProps> = ({
  user,
  onSignOut,
  activeTab = 'dashboard'
}) => {
  const { supabaseUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:30 AM',
      type: 'reminder',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'New Clinic Available',
      message: 'Heart & Vascular Institute is now accepting new patients',
      type: 'update',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Michael Chen has been confirmed for next week',
      type: 'appointment',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'update':
        return <Stethoscope className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="bg-[#378CE7] shadow-sm border-b border-[#5356FF] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-gradient-to-r from-[#5356FF] to-[#378CE7] rounded-lg">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white">iGabay</span>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {activeTab === 'dashboard'
                  ? 'Dashboard'
                  : activeTab === 'appointments'
                  ? 'My Appointments'
                  : activeTab === 'clinics'
                  ? 'Find Clinics'
                  : activeTab === 'profile'
                  ? 'My Profile'
                  : 'Patient Portal'}
              </h2>
              <p className="text-xs sm:text-sm text-[#DFF5FF]">Patient Portal</p>
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">

            {/* Notifications */}
            <NotificationDropdown patientId={supabaseUser?.id || ''} />

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#67C6E3] text-[#5356FF] rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white hidden md:block">
                {user?.firstName || user?.user_metadata?.first_name || 'Patient'}
              </span>
            </div>

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline text-sm">Sign Out</span>
            </Button>
        </div>
      </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-[#5356FF] hover:text-[#378CE7]"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    notification.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-[#DFF5FF] border-[#5356FF]'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#5356FF] rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onSignOut();
        }}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
      />
    </>
  );
};
