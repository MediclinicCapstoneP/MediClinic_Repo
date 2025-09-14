import React, { useState } from 'react';
import { User, Search, LogOut, Stethoscope } from 'lucide-react';
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'appointments':
        return 'My Appointments';
      case 'history':
        return 'Patient History';
      case 'prescriptions':
        return 'Prescriptions';
      case 'patients':
        return 'Patients';
      case 'profile':
        return 'My Profile';
      default:
        return 'Doctor Portal';
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">iGabay Doctor</span>
            </div>
            
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h2>
              <p className="text-sm text-gray-500">Doctor Portal</p>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search patients, appointments, records..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            <DoctorNotificationDropdown doctorUserId={user?.user?.id || user?.id} />
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.full_name || user?.user_metadata?.full_name || 'Doctor'}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
};