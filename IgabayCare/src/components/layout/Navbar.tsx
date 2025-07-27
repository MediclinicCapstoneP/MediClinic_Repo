import React, { useState } from 'react';
import { Bell, User, Building, Search } from 'lucide-react';
import { SearchModal } from '../ui/SearchModal';

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
  variant?: 'patient' | 'clinic';
  searchPlaceholder?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  navigationItems,
  activeTab,
  user,
  onSearch,
  variant = 'patient',
  searchPlaceholder
}) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isPatient = variant === 'patient';
  const primaryColor = isPatient ? 'primary' : 'secondary';
  const Icon = isPatient ? User : Building;
  const userName = isPatient ? user?.firstName : user?.clinicName;
  const defaultSearchPlaceholder = isPatient 
    ? "Search doctors, clinics, specialties..."
    : "Search patients, appointments, or reports...";

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
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            {isPatient && (
              <button
                onClick={handleSearchClick}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 bg-${primaryColor}-100 rounded-full flex items-center justify-center`}>
                <Icon className="h-4 w-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {userName || (isPatient ? 'Patient' : 'Clinic')}
              </span>
            </div>
          </div>
        </div>
        {/* Search Bar - Only show for clinic dashboard */}
        {!isPatient && (
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={searchPlaceholder || defaultSearchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => onSearch(e.target.value)}
              />
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