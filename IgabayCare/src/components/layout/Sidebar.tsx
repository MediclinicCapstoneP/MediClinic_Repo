import React from 'react';
import { User, LogOut, Building } from 'lucide-react';
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
  onSignOut: () => void;
  variant?: 'patient' | 'clinic';
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  activeTab,
  onTabChange,
  user,
  onSignOut,
  variant = 'patient'
}) => {
  const isPatient = variant === 'patient';
  const primaryColor = isPatient ? 'primary' : 'secondary';
  const Icon = isPatient ? User : Building;
  const title = isPatient ? 'iGabayAtiCare' : 'iGabayAtiCare';
  const subtitle = isPatient ? 'Patient Portal' : 'Clinic Portal';
  const userName = isPatient ? user?.firstName : user?.clinicName;
  const userEmail = user?.email;

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-${primaryColor} rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? `bg-${primaryColor}-50 text-${primaryColor}-700 border border-${primaryColor}-200`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ItemIcon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info and Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-8 h-8 bg-${primaryColor}-100 rounded-full flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || (isPatient ? 'Patient' : 'Clinic')}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userEmail || `${isPatient ? 'patient' : 'clinic'}@example.com`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}; 