import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

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
  onSearch: (query: string) => void;
  variant?: 'patient' | 'clinic';
  searchPlaceholder?: string;
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
  children
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        user={user}
        onSignOut={onSignOut}
        variant={variant}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          navigationItems={navigationItems}
          activeTab={activeTab}
          user={user}
          onSearch={onSearch}
          variant={variant}
          searchPlaceholder={searchPlaceholder}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}; 