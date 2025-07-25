import React from 'react';
import { 
  Home, 
  Calendar, 
  History, 
  User, 
  Search, 
  MapPin, 
  Stethoscope,
  Users,
  Settings,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const patientTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search Clinics', icon: Search },
    { id: 'nearby', label: 'Nearby', icon: MapPin },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'chat', label: 'iGabay AI', icon: MessageCircle },
  ];

  const clinicTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabs = user?.role === 'patient' ? patientTabs : clinicTabs;

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center w-full p-3 text-sm font-medium rounded-lg transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} className={`mr-3 ${activeTab === tab.id ? 'text-blue-700' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};