import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppointmentManagement } from '@/components/appointments/AppointmentManagement';

export default function DoctorAppointmentsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <AppointmentManagement userRole="doctor" />
    </SafeAreaView>
  );
}

