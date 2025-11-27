import React, { useEffect, useRef, useState } from 'react';
import { Bell, User, Search, Heart, LogOut, Calendar, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NotificationDropdown } from '../patient/NotificationDropdown';
import { clinicService } from '../../features/auth/utils/clinicService';

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
  onSearch: (query: string) => void;
  onSignOut: () => void;
  activeTab?: string;
}

export const PatientNavbar: React.FC<PatientNavbarProps> = ({
  user,
  onSearch,
  onSignOut,
  activeTab = 'dashboard'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const clinicsCacheRef = useRef<any[] | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<number | null>(null);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
    triggerSuggestions(query);
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchClinicsCache = async () => {
    if (clinicsCacheRef.current) return clinicsCacheRef.current;
    try {
      let result;
      try {
        result = await clinicService.getClinicsWithServices();
      } catch {
        result = await clinicService.getPublicClinics();
      }
      const clinics = result.success ? (result.clinics || []) : [];
      clinicsCacheRef.current = clinics;
      return clinics;
    } catch {
      clinicsCacheRef.current = [];
      return [];
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {}
      );
    }
  }, []);

  const buildSuggestions = (clinics: any[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const loc = locationRef.current;
    const results = clinics
      .map((c) => {
        const servicesList = [
          ...(c.services || []),
          ...(c.custom_services || []),
          ...(c.specialties || []),
          ...(c.custom_specialties || []),
          ...((c.services_with_pricing || []).map((s: any) => s.service_name))
        ];
        const available = (c.services_with_pricing || []).some((s: any) => s.is_available);
        const distance = loc && c.latitude && c.longitude
          ? calculateDistance(loc.lat, loc.lng, Number(c.latitude), Number(c.longitude))
          : undefined;
        const topService = servicesList.find((s: string) => s.toLowerCase().includes(q)) || servicesList[0];
        return { id: c.id, name: c.clinic_name, topService, available, distance, city: c.city };
      })
      .filter((r) => r.name?.toLowerCase().includes(q) || (r.topService || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      })
      .slice(0, 8);
    return results;
  };

  const triggerSuggestions = (query: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      const clinics = await fetchClinicsCache();
      const built = buildSuggestions(clinics, query);
      setSuggestions(built);
      setShowSuggestions(true);
      setLoadingSuggestions(false);
    }, 200);
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

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search clinics, services..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5356FF] focus:shadow-md transition-all duration-200 text-sm placeholder-gray-500"
              />
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="max-h-80 overflow-auto py-2">
                    {loadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No matching clinics</div>
                    ) : (
                      suggestions.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                          onMouseDown={() => {
                            setSearchQuery(s.name);
                            onSearch(s.name);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{s.name}</p>
                              <p className="text-xs text-gray-600">{s.topService || 'General services'}{s.city ? ` • ${s.city}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {typeof s.distance === 'number' && (
                                <span className="text-xs font-medium text-[#5356FF] bg-[#DFF5FF] px-2 py-1 rounded-full">{s.distance.toFixed(1)} km</span>
                              )}
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{s.available ? 'Available' : 'Limited'}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Mobile Search Button */}
            <button onClick={() => setShowSearch(true)} className="lg:hidden p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Search">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <NotificationDropdown patientId={user?.id || ''} />

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

      {/* Mobile Search Modal */}
      <Modal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        title="Search"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clinics, services..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5356FF] focus:border-[#5356FF]"
              autoFocus
            />
            {showSuggestions && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="max-h-80 overflow-auto py-2">
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching clinics</div>
                  ) : (
                    suggestions.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                        onMouseDown={() => {
                          setSearchQuery(s.name);
                          onSearch(s.name);
                          setShowSuggestions(false);
                          setShowSearch(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-600">{s.topService || 'General services'}{s.city ? ` • ${s.city}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {typeof s.distance === 'number' && (
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{s.distance.toFixed(1)} km</span>
                            )}
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{s.available ? 'Available' : 'Limited'}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowSearch(false)}>Search</Button>
          </div>
        </div>
      </Modal>

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
