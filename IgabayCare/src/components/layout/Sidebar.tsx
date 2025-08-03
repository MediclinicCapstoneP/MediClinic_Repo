import React, { useState, useEffect } from 'react';
import { User, Building, Menu, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user: any;
  variant?: 'patient' | 'clinic' | 'doctor';
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  activeTab,
  onTabChange,
  user,
  variant = 'patient'
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPatient = variant === 'patient';
  const isDoctor = variant === 'doctor';
  const Icon = isPatient ? User : isDoctor ? User : Building;
  const title = 'iGabayAtiCare';
  const subtitle = isPatient ? 'Patient Portal' : isDoctor ? 'Doctor Portal' : 'Clinic Portal';
  const userName = isPatient ? user?.firstName : isDoctor ? user?.full_name : user?.clinicName;
  const userEmail = user?.email;

  // Auto-collapse on medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveClasses = (isActive: boolean) => {
    if (isActive) {
      return isPatient 
        ? 'bg-theme-light text-theme-dark border border-theme' 
        : isDoctor
        ? 'bg-purple-50 text-purple-700 border border-purple-200'
        : 'bg-secondary-50 text-secondary-700 border border-secondary-200';
    }
    return 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  const getIconClasses = () => {
    return isPatient 
      ? 'bg-gradient-to-r from-theme to-theme-dark' 
      : isDoctor
      ? 'bg-gradient-to-r from-purple-500 to-purple-600'
      : 'bg-gradient-to-r from-secondary-500 to-secondary-600';
  };

  const getUserIconClasses = () => {
    return isPatient 
      ? 'bg-theme-light text-theme-dark' 
      : isDoctor
      ? 'bg-purple-100 text-purple-600'
      : 'bg-secondary-100 text-secondary-600';
  };

  const SidebarContent = () => (
    <div className={` bg-blue-100 shadow-lg border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo and Brand */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${getIconClasses()} rounded-lg shadow-lg flex-shrink-0`}>
            <Heart className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button - Only show on large screens */}
      <div className="p-2 border-b border-gray-200 md:block hidden">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const ItemIcon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false); // Close mobile menu on click
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group relative ${
                getActiveClasses(isActive)
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <ItemIcon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile and Logout Section */}
      <div className="border-t border-gray-200 p-4">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 ${getUserIconClasses()} rounded-lg flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail || 'user@example.com'}
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>


    </>
  );
}; 