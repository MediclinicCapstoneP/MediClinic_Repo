import React, { useState, useEffect } from 'react';
import { Home, Calendar, Users, UserCheck, Settings,UserCircle  } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ClinicHome } from './ClinicHome';
import { ClinicAppointments } from '../../components/clinic/ClinicAppointments';
import { ClinicDoctors } from './ClinicDoctors';
import { ClinicPatients } from './ClinicPatients';
import { ClinicSettings } from './ClinicSettings';
import { Appointment } from './Appointment';
import { ManageClinic } from './ManageClinic';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { useNavigate } from 'react-router-dom';
import { SkeletonDashboard } from '../../components/ui/Skeleton';



export const ClinicDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await roleBasedAuthService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'clinic') {
          navigate('/clinic-signin');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/clinic-signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Users },
    // { id: 'patients', label: 'Registered Patients', icon: UserCheck },
    { id: 'manage', label: 'Manage Clinic', icon: Settings },
    { id: 'settings', label: 'Profile', icon: UserCircle  },
  ];

  const handleSignOut = async () => {
    try {
      const result = await roleBasedAuthService.signOut();
      if (result.success) {
        // Redirect to landing page after successful sign out
        navigate('/');
      } else {
        console.error('Sign out failed:', result.error);
        // Still redirect even if there's an error
        navigate('/');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Redirect to landing page even if there's an error
      navigate('/');
    }
  };

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality for clinic dashboard
    console.log('Clinic search query:', query);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ClinicHome onNavigate={setActiveTab} />;
      case 'appointments':
        return <Appointment clinicId={user?.clinic_id || ''} />;
      case 'doctors':
        return <ClinicDoctors />;
      case 'patients':
        return <ClinicPatients />;
      case 'manage':
        return <ManageClinic />;
      case 'settings':
        return <ClinicSettings />;
      default:
        return <ClinicHome onNavigate={setActiveTab} />;
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
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
      searchPlaceholder="Search patients, appointments, or reports..."
      showNavbar={true}
    >
      {renderContent()}
    </DashboardLayout>
  );
};
