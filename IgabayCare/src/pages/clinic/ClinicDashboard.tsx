import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Clock,
  Home,
  MessageSquare,
  MapPin,
  Bell
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authService } from '../../features/auth/utils/authService';
import { ClinicHome } from './ClinicHome';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

const ClinicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          navigate('/clinic-signin');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        navigate('/clinic-signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Search query:', query);
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '#'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      href: '#'
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      href: '#'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      href: '#'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      href: '#'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '#'
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: MapPin,
      href: '#'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '#'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '#'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ClinicHome />;
      case 'appointments':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointments</h2>
            <p className="text-gray-600">Manage your clinic appointments here.</p>
          </div>
        );
      case 'patients':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Patients</h2>
            <p className="text-gray-600">View and manage patient records.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
            <p className="text-gray-600">Generate and view clinic reports.</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
            <p className="text-gray-600">View clinic performance analytics.</p>
          </div>
        );
      case 'messages':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <p className="text-gray-600">Manage patient communications.</p>
          </div>
        );
      case 'locations':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Locations</h2>
            <p className="text-gray-600">Manage clinic locations and branches.</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h2>
            <p className="text-gray-600">View and manage notifications.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Configure clinic settings and preferences.</p>
          </div>
        );
      default:
        return <ClinicHome />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50/30 to-accent-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clinic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onSignOut={handleSignOut}
      onSearch={handleSearch}
      variant="clinic"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ClinicDashboard;