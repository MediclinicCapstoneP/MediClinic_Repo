import React, { useState } from 'react';
import { Building, Search, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ClinicNotificationDropdown } from '../clinic/ClinicNotificationDropdown';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
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
      <header className="bg-[#378CE7] shadow-sm border-b border-[#5356FF] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#5356FF] to-[#378CE7] rounded-xl shadow-sm">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">iGabay Clinic</h1>
                <p className="text-xs sm:text-sm text-[#DFF5FF]">Clinic Management Portal</p>
              </div>
            </div>
            <div className="hidden lg:block border-l border-gray-200 pl-4">
              <h2 className="text-lg font-semibold text-white truncate">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search patients, appointments, doctors..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5356FF] focus:shadow-md transition-all duration-200 text-sm placeholder-gray-500"
              />
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Search">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <ClinicNotificationDropdown clinicUserId={user?.user?.id || user?.id} />

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#67C6E3] text-[#5356FF] rounded-full flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{getClinicDisplayName()}</span>
            </div>

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
        </div>
      </div>
      </header>


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
