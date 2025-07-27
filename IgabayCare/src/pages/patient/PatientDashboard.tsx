import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MessageSquare, 
  MapPin, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Clock,
  Home,
  Search,
  History,
  Heart,
  Bell,
  MessageCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authService } from '../../features/auth/utils/authService';
import { PatientHome } from './PatientHome';
import { NearbyClinic } from './NearbyClinic';
import { PatientProfile } from './PatientProfile';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          navigate('/signin');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        navigate('/signin');
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
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '#'
    },
    {
      id: 'search',
      label: 'Search Clinics',
      icon: Search,
      href: '#'
    },
    {
      id: 'nearby',
      label: 'Nearby',
      icon: MapPin,
      href: '#'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      href: '#'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      href: '#'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '#'
    },
    {
      id: 'chat',
      label: 'iGabay AI',
      icon: MessageCircle,
      href: '#'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PatientHome onNavigate={setActiveTab} />;
      case 'search':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Clinics</h2>
            <p className="text-gray-600">Find clinics by name, location, or specialty.</p>
          </div>
        );
      case 'nearby':
        return <NearbyClinic />;
      case 'appointments':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Appointments</h2>
            <p className="text-gray-600">View and manage your upcoming appointments.</p>
          </div>
        );
      case 'history':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical History</h2>
            <p className="text-gray-600">Access your consultation and treatment records.</p>
          </div>
        );
      case 'profile':
        return <PatientProfile />;
      case 'chat':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">iGabay AI Assistant</h2>
            <p className="text-gray-600">Get instant help from our AI assistant.</p>
          </div>
        );
      default:
        return <PatientHome onNavigate={setActiveTab} />;
    }
  };

    if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/30 to-secondary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patient dashboard...</p>
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
      variant="patient"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;