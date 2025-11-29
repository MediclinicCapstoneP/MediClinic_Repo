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
import { useAuth } from '../../contexts/AuthContext';
import { clinicService } from '../../features/auth/utils/clinicService';
import { useNavigate } from 'react-router-dom';
import { SkeletonDashboard } from '../../components/ui/Skeleton';



export const ClinicDashboard: React.FC = () => {
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        // Check if user is authenticated and is a clinic
        if (!authUser) {
          navigate('/clinic-signin');
          return;
        }
        
        if (authUser.role !== 'clinic') {
          navigate('/signin');
          return;
        }
        
        console.log('Authenticated clinic user:', authUser.email);
        setUser(authUser);
        
        // Then, fetch the clinic profile
        try {
          const clinicResult = await clinicService.getClinicByUserId(authUser.id);
          if (clinicResult.success && clinicResult.clinic) {
            console.log('Clinic profile loaded:', clinicResult.clinic.clinic_name);
            setClinicProfile(clinicResult.clinic);
            
            // Combine auth user with clinic profile for UI components
            const enhancedUser = {
              ...authUser,
              clinic_id: clinicResult.clinic.id,
              clinic_name: clinicResult.clinic.clinic_name,
              email: clinicResult.clinic.email,
              phone: clinicResult.clinic.phone,
              address: clinicResult.clinic.address,
              city: clinicResult.clinic.city,
              state: clinicResult.clinic.state,
              status: clinicResult.clinic.status,
              user_metadata: {
                ...authUser.user_metadata,
                clinic_name: clinicResult.clinic.clinic_name
              }
            };
            setUser(enhancedUser);
          } else {
            console.warn('No clinic profile found, using auth user data only');
            // If no clinic profile, try to extract clinic name from metadata
            const clinicName = authUser.user_metadata?.clinic_name || 
                             authUser.user_metadata?.first_name || 
                             'My Clinic';
            setUser({
              ...authUser,
              clinic_name: clinicName,
              user_metadata: {
                ...authUser.user_metadata,
                clinic_name: clinicName
              }
            });
          }
        } catch (profileError) {
          console.error('Error fetching clinic profile:', profileError);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/clinic-signin');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAuthAndFetchProfile();
    }
  }, [authUser, authLoading, navigate]);

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
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
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
        return <Appointment clinicId={clinicProfile?.id || user?.clinic_id || ''} />;
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinic dashboard...</p>
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
      variant="clinic"
      searchPlaceholder="Search patients, appointments, or reports..."
      showNavbar={true}
    >
      {renderContent()}
    </DashboardLayout>
  );
};
