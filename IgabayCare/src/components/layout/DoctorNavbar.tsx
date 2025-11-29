import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Stethoscope, Activity, ChevronDown } from 'lucide-react';
import { DoctorNotificationDropdown } from '../doctor/DoctorNotificationDropdown';

interface DoctorNavbarProps {
  user: any;
  onSignOut: () => void;
  activeTab?: string;
}

export const DoctorNavbar: React.FC<DoctorNavbarProps> = ({
  user,
  onSignOut,
  activeTab = 'dashboard'
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
      <header className="bg-[#378CE7] shadow-sm border-b border-[#5356FF] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="p-2 bg-gradient-to-br from-[#5356FF] to-[#378CE7] rounded-xl shadow-md">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-white tracking-tight">iGabay Doctor</h1>
                  <p className="text-xs text-[#DFF5FF] font-medium">Medical Practice Portal</p>
                </div>
              </div>
              
              <div className="hidden lg:block border-l border-gray-200 pl-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-white truncate">
                      {getPageTitle()}
                    </h2>
                    <p className="text-sm text-[#DFF5FF] truncate">{getPageDescription()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Actions and user */}
            <div className="flex items-center space-x-1 lg:space-x-2">
              {/* Notifications */}
              <DoctorNotificationDropdown doctorUserId={user?.user?.id || user?.id} />
              
              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#5356FF] to-[#378CE7] rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    {getDoctorInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white truncate max-w-32">
                      {getDoctorName()}
                    </p>
                    <p className="text-xs text-[#DFF5FF]">Doctor</p>
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
        </div>
      </header>
    </>
  );
};