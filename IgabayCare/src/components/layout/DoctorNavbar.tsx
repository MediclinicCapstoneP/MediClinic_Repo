import React, { useState, useRef, useEffect } from 'react';
import { User, Search, LogOut, Stethoscope, Bell, Menu, X, Activity, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { DoctorNotificationDropdown } from '../doctor/DoctorNotificationDropdown';

interface DoctorNavbarProps {
  user: any;
  onSearch: (query: string) => void;
  onSignOut: () => void;
  activeTab?: string;
}

export const DoctorNavbar: React.FC<DoctorNavbarProps> = ({
  user,
  onSearch,
  onSignOut,
  activeTab = 'dashboard'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
    searchRef.current?.focus();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'appointments':
        return 'My Appointments';
      case 'history':
        return 'Appointment History';
      case 'prescriptions':
        return 'Prescriptions';
      case 'patients':
        return 'Patient Records';
      case 'profile':
        return 'Profile Management';
      default:
        return 'Doctor Portal';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview of your practice';
      case 'appointments':
        return 'Manage today\'s schedule';
      case 'history':
        return 'View past consultations';
      case 'prescriptions':
        return 'Manage patient medications';
      case 'patients':
        return 'Patient database and records';
      case 'profile':
        return 'Update your information';
      default:
        return 'Medical practice management';
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDoctorName = () => {
    return user?.full_name || user?.user_metadata?.full_name || user?.name || 'Doctor';
  };

  const getDoctorInitials = () => {
    const name = getDoctorName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl shadow-md">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">iGabay Doctor</h1>
                  <p className="text-xs text-blue-600 font-medium">Medical Practice Portal</p>
                </div>
              </div>
              
              <div className="hidden lg:block border-l border-gray-200 pl-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {getPageTitle()}
                    </h2>
                    <p className="text-sm text-gray-500 truncate">{getPageDescription()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Enhanced Search Bar */}
            <div className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search patients, appointments, prescriptions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-all duration-200 text-sm placeholder-gray-500`}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Actions and user */}
            <div className="flex items-center space-x-1 lg:space-x-2">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Search"
              >
                {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              
              {/* Notifications */}
              <DoctorNotificationDropdown doctorUserId={user?.user?.id || user?.id} />
              
              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    {getDoctorInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-32">
                      {getDoctorName()}
                    </p>
                    <p className="text-xs text-gray-500">Doctor</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getDoctorName()}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'doctor@igabay.com'}</p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Navigate to profile - you might need to handle this differently based on your routing
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        View Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Navigate to settings
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Activity className="h-4 w-4 mr-3" />
                        Practice Settings
                      </button>
                      
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onSignOut();
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};