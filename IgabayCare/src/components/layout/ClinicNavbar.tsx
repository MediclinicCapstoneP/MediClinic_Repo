import React, { useState, useEffect } from 'react';
import { Bell, Building, Search, LogOut, Calendar, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'patient' | 'system' | 'alert';
  timestamp: string;
  read: boolean;
}

interface ClinicNavbarProps {
  user: any;
  onSearch: (query: string) => void;
  onSignOut: () => void;
  activeTab?: string;
}

export const ClinicNavbar: React.FC<ClinicNavbarProps> = ({
  user,
  onSearch,
  onSignOut,
  activeTab = 'dashboard'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Appointment Request',
      message: 'John Doe has requested an appointment for tomorrow at 2:00 PM',
      type: 'appointment',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Patient Registration',
      message: 'Sarah Wilson has registered as a new patient',
      type: 'patient',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'System Update',
      message: 'New features have been added to the clinic management system',
      type: 'system',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true
    },
    {
      id: '4',
      title: 'Appointment Confirmed',
      message: 'Dr. Johnson has confirmed the appointment with Mike Chen',
      type: 'appointment',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

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
      case 'patient':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'system':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'appointments':
        return 'Appointments';
      case 'doctors':
        return 'Doctors';
      case 'patients':
        return 'Patients';
      case 'manage':
        return 'Manage Clinic';
      case 'settings':
        return 'Settings';
      default:
        return 'Clinic Portal';
    }
  };

  // Helper function to get clinic display name
  const getClinicDisplayName = () => {
    // Try different sources for clinic name in order of preference
    const clinicName = user?.clinic_name || 
                      user?.user_metadata?.clinic_name || 
                      user?.user?.user_metadata?.clinic_name ||
                      user?.email?.split('@')[0] || 
                      'Clinic';
    
    // Capitalize first letter if it's an email-based name
    if (clinicName && clinicName !== 'Clinic') {
      return clinicName.charAt(0).toUpperCase() + clinicName.slice(1);
    }
    
    return clinicName;
  };

  return (
    <>
      <header className=" bg-blue-100 shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h2>
              <p className="text-sm text-gray-500">Clinic Management Portal</p>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search patients, appointments, doctors..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Mobile Search Button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {getClinicDisplayName()}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
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
        <div className="space-y-4 bg-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-green-600 hover:text-green-700"
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
                      : 'bg-green-50 border-green-200'
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
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Dialog */}
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
