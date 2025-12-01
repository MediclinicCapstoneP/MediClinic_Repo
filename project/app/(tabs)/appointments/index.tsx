import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { AppointmentManagement } from '../../../components/appointments/AppointmentManagement';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  
  // Determine user role from the user object
  const getUserRole = (): 'patient' | 'doctor' | 'clinic' => {
    return user?.role || 'patient';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <AppointmentManagement userRole={getUserRole()} />
    </SafeAreaView>
  );
}

