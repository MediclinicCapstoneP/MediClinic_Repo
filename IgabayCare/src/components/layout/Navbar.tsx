import React from 'react';
import { User, Building, Heart, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import PushNotificationDropdown from '../notifications/PushNotificationDropdown';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavbarProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  user: any;
  onSignOut: () => void;
  variant?: 'patient' | 'clinic';
}

export const Navbar: React.FC<NavbarProps> = ({
  navigationItems,
  activeTab,
  user,
  onSignOut,
  variant = 'patient'
}) => {
  const isPatient = variant === 'patient';
  const Icon = isPatient ? User : Building;
  const userName = isPatient 
    ? user?.firstName 
    : user?.user_metadata?.clinic_name || user?.clinicName || 'Clinic';

  const getUserIconClasses = () => {
    return isPatient 
      ? 'bg-primary-100 text-primary-600' 
      : 'bg-secondary-100 text-secondary-600';
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
            {/* Notifications */}
            <PushNotificationDropdown />
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${getUserIconClasses()} rounded-full flex items-center justify-center`}>
                <Icon className="h-4 w-4" />
              </div>
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