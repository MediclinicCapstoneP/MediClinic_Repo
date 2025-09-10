import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentManagement } from '@/components/appointments/AppointmentManagement';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  
  // Determine user role - this should be based on your auth context
  // For now, defaulting to 'patient' but you can implement proper role detection
  const getUserRole = (): 'patient' | 'doctor' | 'clinic' => {
    // You might have user.role or user.user_metadata.role
    return (user?.user_metadata?.role as 'patient' | 'doctor' | 'clinic') || 'patient';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <AppointmentManagement userRole={getUserRole()} />
    </SafeAreaView>
  );
}

