import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MapPin, 
  History, 
  Home,
  Pill
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import PatientHome from './PatientHome';
import { PatientProfileComponent } from './PatientProfile';
import { PatientAppointments } from './PatientAppointments';
import {PatientHistory} from './PatientHistory';
import PatientPrescriptionsPage from './PatientPrescriptions';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { SkeletonDashboard } from '../../components/ui/Skeleton';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Use auth context loading state, no need for separate auth check
    if (!authLoading) {
      if (!user) {
        navigate('/signin');
        return;
      }
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Patient search query:', query);
  };

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
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
      id: 'prescriptions',
      label: 'Prescriptions',
      icon: Pill,
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
    }
  ];

  const patientId = user?.id || user?.user?.id || '';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PatientHome onNavigate={setActiveTab} />;
      case 'appointments':
        return <PatientAppointments onNavigate={setActiveTab} />;
      case 'prescriptions':
        return <PatientPrescriptionsPage />;
      case 'history':
        return (
          <PatientHistory patientId={patientId} />
        );
      case 'profile':
        return <PatientProfileComponent />;
      default:
        return <PatientHome onNavigate={setActiveTab} />;
    }
  };

  if (loading || authLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onSignOut={handleSignOut}
      variant="patient"
      showNavbar={true}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;
