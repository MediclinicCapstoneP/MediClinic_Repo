import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PatientNavbar } from './PatientNavbar';
import { ClinicNavbar } from './ClinicNavbar';
import { DoctorNavbar } from './DoctorNavbar';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface DashboardLayoutProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user: any;
  onSignOut: () => void;
  onSearch?: (query: string) => void;
  variant?: 'patient' | 'clinic' | 'doctor';
  searchPlaceholder?: string;
  showNavbar?: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  navigationItems,
  activeTab,
  onTabChange,
  user,
  onSignOut,
  onSearch,
  variant = 'patient',
  searchPlaceholder,
  showNavbar = false,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        user={user}
        variant={variant}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Navbar - Only show if showNavbar is true */}
        {showNavbar && onSearch && (
          <>
            {variant === 'patient' && (
              <PatientNavbar
                user={user}
                onSearch={onSearch}
                onSignOut={onSignOut}
                activeTab={activeTab}
              />
            )}
            {variant === 'clinic' && (
              <ClinicNavbar
                user={user}
                onSearch={onSearch}
                onSignOut={onSignOut}
                activeTab={activeTab}
              />
            )}
            {variant === 'doctor' && (
              <DoctorNavbar
                user={user}
                onSearch={onSearch}
                onSignOut={onSignOut}
                activeTab={activeTab}
              />
            )}

          </>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 