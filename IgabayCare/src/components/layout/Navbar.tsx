import React, { useState } from 'react';
import { Bell, User, Building, Search, Heart, LogOut } from 'lucide-react';
import { SearchModal } from '../ui/SearchModal';
import { Button } from '../ui/Button';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface NavbarProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  user: any;
  onSearch: (query: string) => void;
  onSignOut: () => void;
  variant?: 'patient' | 'clinic';
  searchPlaceholder?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  navigationItems,
  activeTab,
  user,
  onSearch,
  onSignOut,
  variant = 'patient',
  searchPlaceholder
}) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isPatient = variant === 'patient';
  const Icon = isPatient ? User : Building;
  const userName = isPatient 
    ? user?.firstName 
    : user?.user_metadata?.clinic_name || user?.clinicName || 'Clinic';
  const defaultSearchPlaceholder = isPatient 
    ? "Search doctors, clinics, specialties..."
    : "Search patients, appointments, or reports...";

  const getUserIconClasses = () => {
    return isPatient 
      ? 'bg-primary-100 text-primary-600' 
      : 'bg-secondary-100 text-secondary-600';
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleSearchModalClose = () => {
    setIsSearchModalOpen(false);
  };

  const handleSearchModalSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left side - Page title and breadcrumb */}
          <div className="flex items-center space-x-4">
            {/* Mobile logo for patient dashboard */}
            {isPatient && (
              <div className="lg:hidden flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">iGabay</span>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 hidden sm:block">
                {isPatient ? 'Patient Portal' : 'Clinic Portal'}
              </p>
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Search Button - Only for patients */}
            {isPatient && (
              <button
                onClick={handleSearchClick}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            
            {/* Notifications */}
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" /> */}
            </button>
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${getUserIconClasses()} rounded-full flex items-center justify-center`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {userName || (isPatient ? 'Patient' : 'Clinic')}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        {!isPatient && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={searchPlaceholder || defaultSearchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-secondary-500 focus:shadow-md transition-all duration-200 text-sm placeholder-gray-500"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal for Patients */}
      {isPatient && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={handleSearchModalClose}
          searchQuery={searchQuery}
          onSearch={handleSearchModalSearch}
        />
      )}
    </>
  );
};