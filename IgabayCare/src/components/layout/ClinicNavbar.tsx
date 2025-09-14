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
            <ClinicNotificationDropdown clinicUserId={user?.user?.id || user?.id} />

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
